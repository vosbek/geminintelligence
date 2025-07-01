// components/curation/PricingTierCard.tsx - Card for displaying a single pricing tier
'use client';

import { CheckIcon } from '@heroicons/react/24/outline';

interface PricingTier {
  tier_name: string;
  price_usd: number | string;
  price_unit: string;
  features: string[];
}

interface PricingTierCardProps {
  tier: PricingTier;
}

export default function PricingTierCard({ tier }: PricingTierCardProps) {
  return (
    <div className="border rounded-lg p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800">{tier.tier_name}</h3>
      <div className="my-4">
        <span className="text-4xl font-bold">
          {typeof tier.price_usd === 'number' ? `$${tier.price_usd}` : tier.price_usd}
        </span>
        <span className="text-gray-500 ml-2">/ {tier.price_unit}</span>
      </div>
      <ul className="space-y-3 text-sm text-gray-600 flex-grow">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
        Get Started
      </button>
    </div>
  );
} 