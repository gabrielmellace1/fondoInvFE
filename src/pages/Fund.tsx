import { Card, CardTitle, CardDescription } from "../components/ui/card";
import ProgressBar from "../components/ui/progressbar/ProgressBar";
import Badge from "../components/ui/badge/Badge";
import LineChartOne from "../components/charts/line/LineChartOne";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";

// Mock data
const fund = {
  name: "Fondo de Inversión ABC",
  profileImageUrl: "/images/cards/card-01.png",
  type: "crowdfunding", // 'crowdfunding' | 'credit' | 'multi-asset'
  status: "Captando", // 'Captando' | 'Cerrado' | 'Activo' | 'Finalizado'
  createdAt: "2024-04-01T12:00:00Z",
  acquired: 75000,
  total: 100000,
  description: "Este fondo invierte en proyectos de energías renovables en Latinoamérica.",
  strategy: "Diversificación en proyectos solares y eólicos con retorno anual estimado del 12%.",
  holdings: [
    { name: "USDT", amount: 50000, value: 50000 },
    { name: "ETH", amount: 10, value: 30000 },
    { name: "BTC", amount: 1, value: 20000 },
  ],
};

const typeLabels: Record<string, string> = {
  crowdfunding: "Crowdfunding",
  credit: "Credit Fund",
  "multi-asset": "Multi Asset Fund",
};
const statusColors: Record<string, any> = {
  Captando: "primary",
  Cerrado: "error",
  Activo: "success",
  Finalizado: "dark",
};

export default function Fund() {
  const progress = Math.round((fund.acquired / fund.total) * 100);
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <Card>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <img
            src={fund.profileImageUrl}
            alt={fund.name}
            className="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-800"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle>{fund.name}</CardTitle>
              <Badge color="info" variant="solid">{typeLabels[fund.type]}</Badge>
              <Badge color={statusColors[fund.status]} variant="solid">{fund.status}</Badge>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Creado el {new Date(fund.createdAt).toLocaleDateString()}
            </div>
            <div className="mt-2">
              <ProgressBar progress={progress} label="outside" size="md" />
              <div className="text-xs text-gray-500 mt-1">
                {fund.acquired.toLocaleString()} / {fund.total.toLocaleString()} USDT recaudados
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardTitle>Evolución del Fondo</CardTitle>
          <LineChartOne />
        </Card>
        <Card>
          <CardTitle>Holdings</CardTitle>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Nombre</TableCell>
                <TableCell isHeader>Cantidad</TableCell>
                <TableCell isHeader>Valor (USDT)</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fund.holdings.map((h) => (
                <TableRow key={h.name}>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>{h.amount}</TableCell>
                  <TableCell>{h.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardTitle>Descripción</CardTitle>
          <CardDescription>{fund.description}</CardDescription>
        </Card>
        <Card>
          <CardTitle>Estrategia</CardTitle>
          <CardDescription>{fund.strategy}</CardDescription>
        </Card>
      </div>
    </div>
  );
} 