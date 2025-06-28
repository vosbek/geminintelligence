// app/tool/[id]/page.tsx - Detailed tool view with curation
import { getToolDetail } from '@/lib/db';
import { notFound } from 'next/navigation';
import ToolHeader from '@/components/tool/ToolHeader';
import ToolTabs from '@/components/tool/ToolTabs';
import { ToolDetailData } from '@/types/database';

interface Props {
  params: {
    id: string;
  };
}

export default async function ToolDetail({ params }: Props) {
  const data = await getToolDetail(params.id) as ToolDetailData | null;

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ToolHeader tool={data.tool} snapshot={data.snapshot} />
      <ToolTabs data={data} />
    </div>
  );
}