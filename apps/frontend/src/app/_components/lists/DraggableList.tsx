import React, { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ItemList from "./ItemList";

interface DraggableListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onItemsChange: (newItems: T[]) => void;
  getId: (item: T) => UniqueIdentifier
}

function DraggableList<T>({ items, renderItem, onItemsChange, getId }: DraggableListProps<T>) {
  const [internalItems, setInternalItems] = useState(items);
  
  // Use a ref to track if we need to call onItemsChange
  const pendingUpdate = useRef<T[] | null>(null);

  // Whenever the incoming 'items' prop changes, 
  // update our internal copy too so we stay in sync.
  useEffect(() => {
    setInternalItems(items);
  }, [items]);

  // Handle calling onItemsChange outside of render
  useEffect(() => {
    if (pendingUpdate.current) {
      onItemsChange(pendingUpdate.current);
      pendingUpdate.current = null;
    }
  });

  // Setting up the pointer sensor for drag-and-drop (mouse/touch detection)
  const sensors = useSensors(useSensor(PointerSensor));

  // Handle what happens when the user finishes dragging an item
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      // Find the index of the dragged item (active) and the item it was dropped over (over)
      const oldIndex = internalItems.findIndex((item) => getId(item) === active.id);
      const newIndex = internalItems.findIndex((item) => getId(item) === over.id);

      // Reorder the list by moving the item from oldIndex to newIndex
      const newItems = arrayMove(internalItems, oldIndex, newIndex);
      
      // Update internalItems with the new list for local rendering
      setInternalItems(newItems);
      
      // Store the updated items to trigger the callback in useEffect
      pendingUpdate.current = newItems;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={internalItems.map(getId)} strategy={verticalListSortingStrategy}>
        <ItemList items={internalItems} renderItem={renderItem} getId={getId} />
      </SortableContext>
    </DndContext>
  );
}

export default DraggableList;