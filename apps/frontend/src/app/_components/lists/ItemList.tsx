import React from 'react';

interface ItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getId: (item: T) => string | number; 
}

function ItemList<T> ({ items, renderItem, getId }: ItemListProps<T>) {
  return (
    <div className={`space-y-2 max-h-[60vh] overflow-y-auto scrollbar`}>
      {items.map((item) => (
        <div key={getId(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export default ItemList;
