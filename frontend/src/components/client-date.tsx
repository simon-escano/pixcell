import React from "react";

interface ClientDateProps {
  date: string | Date;
  options?: Intl.DateTimeFormatOptions;
}

const ClientDate: React.FC<ClientDateProps> = ({ date, options }) => {
  const [formatted, setFormatted] = React.useState<string>(
    typeof date === "string" ? date : date.toString()
  );

  React.useEffect(() => {
    const d = typeof date === "string" ? new Date(date) : date;
    setFormatted(d.toLocaleString(undefined, options));
  }, [date, options]);

  return <span suppressHydrationWarning>{formatted}</span>;
};

export default ClientDate; 