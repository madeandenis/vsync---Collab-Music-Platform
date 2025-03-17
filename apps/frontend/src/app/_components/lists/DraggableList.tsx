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

  const prevInternalItemsRef = useRef<T[]>(items);

  // Update the internal items only if the items prop changes
  useEffect(() => {
    if (items !== prevInternalItemsRef.current) {
      setInternalItems(items);
      prevInternalItemsRef.current = items;  // Update the reference to the new items
    }
  }, [items]);  // Only triggers when items change

  // Update the parent when internalItems changes
  useEffect(() => {
    if (JSON.stringify(internalItems) !== JSON.stringify(prevInternalItemsRef.current)) {
      // Update the parent only if the items have changed
      onItemsChange(internalItems);
      prevInternalItemsRef.current = [...internalItems]; // Update ref to avoid triggering again
    }
  }, [internalItems, onItemsChange]);

  // Set up sensors for drag-and-drop
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    // If the item is dropped in a new position reorder the items
    if (active.id !== over.id) {
      setInternalItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => getId(item) === active.id);
        const newIndex = prevItems.findIndex((item) => getId(item) === over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
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
