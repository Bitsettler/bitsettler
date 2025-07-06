# Bitcraft.Guide

A comprehensive crafting guide and recipe visualizer for BitCraft, built with Next.js, React Flow, and TypeScript.

Got questions or feedback? Come say hi!
[Discord](https://discord.gg/DYzfsbVyNw)

## Features

- 🔍 **Item Search**: Search through all items, cargo, and resources in the game
- 📊 **Recipe Visualization**: Interactive flow diagrams showing crafting dependencies
- 🎯 **Quantity Calculator**: Calculate required materials for any desired output quantity
- 🌐 **Internationalization**: Multi-language support with next-intl
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Flow Diagrams**: React Flow (@xyflow/react)
- **Layout Engine**: Dagre.js
- **Internationalization**: next-intl
- **Code Quality**: ESLint, Prettier with organize-imports plugin

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bitcraft.guide-web-next
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without changes
- `npm run generate-samples` - Generate sample data
- `npm run map-items` - Map game items from server data
- `npm run map-items:sample` - Map items with sample data

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   └── [locale]/          # Internationalized routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── data/                 # Game data (items, recipes, etc.)
├── lib/                  # Utility functions and types
├── scripts/              # Data processing scripts
└── styles/               # Global styles
```

## Data Sources

The project uses game data from BitCraft's server files, including:

- Items, cargo, and resources
- Crafting recipes and requirements
- Building and tool information

## Acknowledgments

Special thanks to [@wizjany](https://github.com/wizjany) and the [BitCraft ToolBox](https://github.com/BitCraftToolBox) organization for providing access to the in-game database repositories that make this project possible.

## Development

### Code Style

This project uses:

- **Prettier** for code formatting with organize-imports plugin
- **ESLint** for code linting
- **TypeScript** for type safety

### Adding New Features

1. Follow the existing component patterns using shadcn/ui
2. Add proper TypeScript types in `src/lib/types.ts`
3. Use the established import organization
4. Test on both desktop and mobile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run format` and `npm run lint`
5. Submit a pull request

## License

This project is licensed under the MIT License.
