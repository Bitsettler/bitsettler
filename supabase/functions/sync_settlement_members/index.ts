// supabase/functions/sync_settlement_members/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
function parseDate(val) {
  if (!val) return null;
  if (typeof val === "string" && !isNaN(Date.parse(val))) return val // already ISO
  ;
  if (typeof val === "number" && val > 1000000000000) {
    // Likely ms or µs
    if (val > 1000000000000000) {
      return new Date(val / 1000).toISOString();
    } else {
      return new Date(val).toISOString();
    }
  }
  return null;
}
const BITJITA_API_BASE = 'https://bitjita.com/api/claims';
serve(async (req)=>{
  // Handle POST request and get settlementId from request body
  if (req.method !== 'POST') {
    return new Response('Method not allowed. Use POST.', {
      status: 405
    });
  }
  let settlementId;
  try {
    const body = await req.json();
    settlementId = body.settlementId;
  } catch (error) {
    return new Response('Invalid JSON body', {
      status: 400
    });
  }
  if (!settlementId) {
    return new Response('Missing settlementId in request body', {
      status: 400
    });
  }
  try {

    const [citizensRes, membersRes] = await Promise.all([
      fetch(`${BITJITA_API_BASE}/${settlementId}/citizens`).then((r)=>r.json()),
      fetch(`${BITJITA_API_BASE}/${settlementId}/members`).then((r)=>r.json())
    ]);

    // Extract citizen entity IDs for filtering players
    const citizenEntityIds = citizensRes.citizens.map((c: any) => c.entityId);

    // Fetch players where their id is in the array of citizen entity IDs
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', citizenEntityIds);

    if (playersError) return new Response(`Players fetch error: ${playersError.message}`, {
      status: 500
    });
    
    const citizensById = Object.fromEntries(citizensRes.citizens.map((c)=>[
        c.entityId,
        c
      ]));
    const membersById = Object.fromEntries(membersRes.members.map((m)=>[
        m.playerEntityId,
        m
      ]));
    
    // Create a map of existing players by their ID for quick lookup
    const existingPlayersById = Object.fromEntries(
      (players || []).map((player: any) => [player.id, player])
    );
    
    const upsertPlayersList = [];
    for(const playerEntityId in membersById){
      const member = membersById[playerEntityId];
      const citizen = citizensById[playerEntityId];
      const settlementPermissions = {
        claimEntityId: member.claimEntityId,
        inventoryPermission: member.inventoryPermission,
        buildPermission: member.buildPermission,
        officerPermission: member.officerPermission,
        coOwnerPermission: member.coOwnerPermission
      };
      
      // Check if player already exists
      const existingPlayer = existingPlayersById[playerEntityId];
      let mergedSettlements = [settlementPermissions];
      
      if (existingPlayer && existingPlayer.settlements) {
        // Merge existing settlements with new settlement permissions
        const existingSettlements = existingPlayer.settlements;
        const existingSettlementIndex = existingSettlements.findIndex(
          (settlement: any) => settlement.claimEntityId === settlementId
        );
        
        if (existingSettlementIndex !== -1) {
          // Update existing settlement with new permissions
          mergedSettlements = [...existingSettlements];
          mergedSettlements[existingSettlementIndex] = settlementPermissions;
        } else {
          // Add new settlement to existing settlements
          mergedSettlements = [...existingSettlements, settlementPermissions];
        }
      }
      
      upsertPlayersList.push({
        id: playerEntityId,
        name: member.userName || citizen?.userName,
        settlements: mergedSettlements,
        skills: citizen?.skills ?? null,
        total_skills: citizen?.totalSkills,
        highest_level: citizen?.highestLevel,
        total_level: citizen?.totalLevel,
        total_xp: citizen?.totalXP,
        last_login_timestamp: parseDate(member.lastLoginTimestamp),
        joined_settlement_at: parseDate(member.createdAt)
      });
    }
    if (upsertPlayersList.length > 0) {
      const { error: upsertPlayersListError } = await supabase.from('players').upsert(upsertPlayersList, {
        onConflict: 'id'
      });
      if (upsertPlayersListError) {
        console.error('Upsert MembersList error:', upsertPlayersListError);
        return new Response(`Upsert error: ${upsertPlayersListError.message}`, {
          status: 500
        });
      }
    }
    return new Response('Sync complete', {
      status: 200
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(`Sync error: ${error.message}`, {
      status: 500
    });
  }
});
