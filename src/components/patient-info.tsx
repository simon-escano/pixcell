import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
];

export function PatientInfo({ patient }: { patient: any }) {
  if (!patient) return <div>No patient found.</div>;

  const filteredKeys = Object.keys(patient).filter(
    (key) => key !== "imageUrl" && key !== "notes",
  );

  return (
    <Table>
      <TableBody>
        {filteredKeys.map((key) => (
          <TableRow key={key}>
            <TableHead className="pr-4 text-right font-medium">
              {key.replace(/([A-Z])/g, " $1")}
            </TableHead>
            <TableCell>{String(patient[key])}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
