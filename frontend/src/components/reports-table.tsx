"use client";
import { Report } from "@/db/schema";
import { DataTable } from "./data-table";

const ReportsTable = ({reports}:{reports: Report[]}) => {

  return (
    <DataTable
    data={reports}
    searchPlaceholder="Search report..."

    >

    </DataTable>
  )
}