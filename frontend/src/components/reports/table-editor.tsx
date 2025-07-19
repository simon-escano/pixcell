"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

interface TableEditorProps {
  onTableAdd: (tableData: TableData) => void;
}

export const TableEditor = ({ onTableAdd }: TableEditorProps) => {
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [tableTitle, setTableTitle] = useState("");
  const [headers, setHeaders] = useState<string[]>(["Column 1", "Column 2"]);
  const [rows, setRows] = useState<string[][]>([["", ""]]);

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, ""]));
  };

  const removeColumn = (index: number) => {
    if (headers.length > 1) {
      setHeaders(headers.filter((_, i) => i !== index));
      setRows(rows.map(row => row.filter((_, i) => i !== index)));
    }
  };

  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill("")]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const handleSaveTable = () => {
    if (tableTitle.trim()) {
      const tableData: TableData = {
        id: crypto.randomUUID(),
        title: tableTitle,
        headers,
        rows,
      };
      onTableAdd(tableData);
      setIsAddingTable(false);
      setTableTitle("");
      setHeaders(["Column 1", "Column 2"]);
      setRows([["", ""]]);
    }
  };

  const handleCancel = () => {
    setIsAddingTable(false);
    setTableTitle("");
    setHeaders(["Column 1", "Column 2"]);
    setRows([["", ""]]);
  };

  return (
    <div className="space-y-4">
      {!isAddingTable ? (
        <Button
          onClick={() => setIsAddingTable(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add Table to Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tableTitle">Table Title</Label>
              <Input
                id="tableTitle"
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
                placeholder="Enter table title..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Table Headers</Label>
                <Button
                  onClick={addColumn}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Column
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={header}
                      onChange={(e) => updateHeader(index, e.target.value)}
                      placeholder="Header name"
                    />
                    {headers.length > 1 && (
                      <Button
                        onClick={() => removeColumn(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Table Data</Label>
                <Button
                  onClick={addRow}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Row
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <TableCell key={colIndex}>
                            <Input
                              value={cell}
                              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                              placeholder="Enter data..."
                              className="border-0 p-0 h-8"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          {rows.length > 1 && (
                            <Button
                              onClick={() => removeRow(rowIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveTable} disabled={!tableTitle.trim()}>
                Add Table
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const TableDisplay = ({ tableData }: { tableData: TableData }) => {
  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2">{tableData.title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {tableData.headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <TableCell key={colIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 