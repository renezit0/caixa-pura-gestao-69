import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveListProps {
  data: any[];
  renderCard: (item: any) => React.ReactNode;
  renderTable: () => React.ReactNode;
}

export const ResponsiveList: React.FC<ResponsiveListProps> = ({
  data,
  renderCard,
  renderTable
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <Card key={item.id || index} className="card-gradient">
            <CardContent className="p-4">
              {renderCard(item)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return renderTable();
};
