"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "accountant";
  status: "active" | "inactive";
  lastLoginAt?: string;
  createdAt: string;
}

const columns: Column<User>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
  },
  {
    key: "role",
    header: "Role",
    sortable: true,
    render: (value) => (
      <Badge variant={value === "admin" ? "default" : "secondary"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (value) => (
      <Badge variant={value === "active" ? "default" : "destructive"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "lastLoginAt",
    header: "Last Login",
    sortable: true,
    render: (value) => value ? new Date(value).toLocaleDateString() : "Never",
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];

const formFields: FormFieldConfig[] | ((item: User | null) => FormFieldConfig[]) = (item) => [
   {
     name: "name",
     label: "Full Name",
     type: "text",
     required: true,
     placeholder: "Enter full name",
   },
   {
     name: "email",
     label: "Email Address",
     type: "email",
     required: true,
     placeholder: "Enter email address",
   },
   {
     name: "password",
     label: "Password",
     type: "password",
     required: !item,
     placeholder: item ? "Leave blank to keep current password" : "Enter password",
   },
   {
     name: "role",
     label: "Role",
     type: "select",
     required: true,
     options: [
       { label: "Admin", value: "admin" },
       { label: "Manager", value: "manager" },
       { label: "Accountant", value: "accountant" },
     ],
   },
   {
     name: "status",
     label: "Status",
     type: "select",
     required: true,
     options: [
       { label: "Active", value: "active" },
       { label: "Inactive", value: "inactive" },
     ],
   },
 ];

export default function UsersPage() {
  return (
    <PageLayout title="Users" breadcrumbs={["Dashboard", "Users"]}>
      <CrudPage
        title="Users"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: apiClient.getUsers,
          create: (data) => apiClient.post("/users", data),
          update: (id, data) => apiClient.patch(`/users/${id}`, data),
          delete: (id) => apiClient.delete(`/users/${id}`),
        }}
        searchPlaceholder="Search users..."
      />
    </PageLayout>
  );
}