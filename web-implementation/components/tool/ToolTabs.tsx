// components/tool/ToolTabs.tsx - Tabbed interface for tool data sections
'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ToolDetailData } from '@/types/database';
import BasicInfoSection from '@/components/curation/BasicInfoSection';
import TechnicalDetailsSection from '@/components/curation/TechnicalDetailsSection';
import CompanyInfoSection from '@/components/curation/CompanyInfoSection';
import CommunityMetricsSection from '@/components/curation/CommunityMetricsSection';
import ScreenshotsSection from '@/components/curation/ScreenshotsSection';
import EnterprisePositionSection from '@/components/curation/EnterprisePositionSection';
import RawDataSection from '@/components/curation/RawDataSection';

interface ToolTabsProps {
  data: ToolDetailData;
}

const tabs = [
  { name: 'Basic Info', id: 'basic' },
  { name: 'Technical Details', id: 'technical' },
  { name: 'Company Info', id: 'company' },
  { name: 'Community Metrics', id: 'community' },
  { name: 'Screenshots', id: 'screenshots' },
  { name: 'Enterprise Position', id: 'enterprise' },
  { name: 'Raw Data', id: 'raw' },
];

export default function ToolTabs({ data }: ToolTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'basic':
        return <BasicInfoSection data={data} />;
      case 'technical':
        return <TechnicalDetailsSection data={data} />;
      case 'company':
        return <CompanyInfoSection data={data} />;
      case 'community':
        return <CommunityMetricsSection data={data} />;
      case 'screenshots':
        return <ScreenshotsSection data={data} />;
      case 'enterprise':
        return <EnterprisePositionSection data={data} />;
      case 'raw':
        return <RawDataSection data={data} />;
      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-50 p-1">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
                }`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels className="p-6">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.id} className="space-y-6">
              {renderTabContent(tab.id)}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}