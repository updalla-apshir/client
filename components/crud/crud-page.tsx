"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, Column } from "./data-table";
import { FormModal, FormFieldConfig } from "./form-modal";
import { DeleteDialog } from "./delete-dialog";
import { toast } from "sonner";

export interface CrudPageProps<T extends { id: number | string }> {
  title: string;
  columns: Column<T>[];
  formFields: FormFieldConfig[] | ((item: T | null) => FormFieldConfig[]);
  api: {
    getAll: () => Promise<T[]>;
    create?: (data: Partial<T>) => Promise<T>;
    update?: (id: number | string, data: Partial<T>) => Promise<T>;
    delete?: (id: number | string) => Promise<void>;
    print?: (item: T) => void;
  };
  searchPlaceholder?: string;
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds
}

export function CrudPage<T extends { id: number | string }>({
  title,
  columns,
  formFields,
  api,
  searchPlaceholder,
  enablePolling = false,
  pollingInterval = 30000, // 30 seconds default
}: CrudPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const data = await api.getAll();
        setData(data);
        if (showLoading) setLoading(false);
        return data;
      } catch (error) {
        console.error("Failed to fetch data:", error);
        retryCount++;

        if (retryCount <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Exponential backoff, max 5s
          console.log(`Retrying data fetch in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          if (showLoading) setLoading(false);
          throw error;
        }
      }
    }
  }, [api]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchData]);

  // Polling effect for data synchronization
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(() => {
      fetchData(false).catch(error => {
        console.warn("Polling fetch failed:", error);
      });
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, fetchData]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = (item: T) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: Partial<T>) => {
    try {
      setSubmitting(true);

      if (editingItem) {
        // Optimistic update: Update item in local state immediately
        const updatedItem = { ...editingItem, ...formData };
        setData(prevData => prevData.map(item =>
          item.id === editingItem.id ? updatedItem : item
        ));

        try {
          if (api.update) {
            await api.update(editingItem.id, formData);
            toast.success("Item updated successfully");
          }
        } catch (updateError) {
          // Rollback optimistic update on failure
          setData(prevData => prevData.map(item =>
            item.id === editingItem.id ? editingItem : item
          ));
          throw updateError;
        }

        // For updates, don't fetch immediately to preserve sort order
        // Polling will sync data eventually
      } else {
        // Optimistic update: Add item to local state immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticItem = {
          ...formData,
          id: tempId, // Temporary ID that won't conflict with real IDs
          createdAt: new Date().toISOString(),
        } as unknown as T;
        setData(prevData => [...prevData, optimisticItem]);

        try {
          if (api.create) {
            const createdItem = await api.create(formData);
            // Replace optimistic item with real data
            setData(prevData => prevData.map(item =>
              item.id === tempId ? createdItem : item
            ));
            toast.success("Item created successfully");
          }
        } catch (createError) {
          // Rollback optimistic update on failure
          setData(prevData => prevData.filter(item => item.id !== tempId));
          throw createError;
        }

        // For creates, fetch after to ensure new item appears
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      setSubmitting(true);
      if (api.delete) {
        await api.delete(deletingItem.id);
        toast.success("Item deleted successfully");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DataTable
        data={data}
        columns={columns}
        onCreate={api.create ? handleCreate : undefined}
        onEdit={api.update ? handleEdit : undefined}
        onDelete={api.delete ? handleDelete : undefined}
        onPrint={api.print}
        searchable
        searchPlaceholder={searchPlaceholder}
        loading={loading}
        title={title}
      />

      <FormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingItem ? `Edit ${title.slice(0, -1)}` : `Create ${title.slice(0, -1)}`}
        description={`Fill in the details for the ${title.toLowerCase().slice(0, -1)}`}
        fields={typeof formFields === 'function' ? formFields(editingItem) : formFields}
        defaultValues={editingItem || {}}
        loading={submitting}
      />

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${title.slice(0, -1)}`}
        itemName={(deletingItem as any)?.name || (deletingItem as any)?.title || String(deletingItem?.id)}
        loading={submitting}
      />
    </div>
  );
}