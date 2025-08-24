import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import ProjectWizard from '@/features/projects/new/ProjectWizard';

interface NewProjectPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'New Project - BitSettler',
    description: 'Create a new settlement project with manual entry or auto-generated materials from the calculator.',
  };
}

export default async function NewProjectPage({
  params
}: NewProjectPageProps) {
  const { locale } = await params;
  
  // Enable static rendering
  setRequestLocale(locale);

  return <ProjectWizard />;
}
