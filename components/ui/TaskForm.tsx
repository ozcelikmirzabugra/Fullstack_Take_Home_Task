"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCreateSchema, TaskUpdateSchema } from "@/lib/zod";
import { z } from "zod";

type TaskFormData = z.infer<typeof TaskCreateSchema>;
type TaskUpdateData = z.infer<typeof TaskUpdateSchema>;

type TaskFormProps = {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData | TaskUpdateData) => Promise<void>;
  isEditing?: boolean;
  isLoading?: boolean;
};

const statusOptions = [
  { value: "todo", label: "Yapılacak" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "done", label: "Tamamlandı" },
  { value: "archived", label: "Arşivlendi" },
];

export function TaskForm({
  initialData,
  onSubmit,
  isEditing = false,
  isLoading = false,
}: TaskFormProps) {
  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialData?.status || "todo",
      due_date: initialData?.due_date
        ? new Date(initialData.due_date).toISOString().split("T")[0]
        : "",
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      // Convert date string to Date object if provided
      const processedData = {
        ...data,
        due_date: data.due_date ? new Date(data.due_date as string) : undefined,
      };

      // Validate based on editing mode
      const validatedData = isEditing
        ? TaskUpdateSchema.parse(processedData)
        : TaskCreateSchema.parse(processedData);

      await onSubmit(validatedData);

      if (!isEditing) {
        form.reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Görev Başlığı</FormLabel>
              <FormControl>
                <Input placeholder="Görev başlığını girin..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama (Opsiyonel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Görev detaylarını yazın..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durum</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Son Tarih (Opsiyonel)</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "İşleniyor..." : isEditing ? "Güncelle" : "Oluştur"}
        </Button>
      </form>
    </Form>
  );
}
