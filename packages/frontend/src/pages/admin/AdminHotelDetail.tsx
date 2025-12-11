import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge, { ImportanceBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Ban,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Task {
  questionId: string;
  serialNo: number;
  checklistItem: string;
  category: { id: string; name: string };
  department: { id: string; name: string };
  keyWords: string[];
  importance: string;
  scoring: number;
  taskProgressId: string | null;
  status: string;
  estimatedDate: string | null;
  completedDate: string | null;
  remark: string | null;
  updatedAt: string | null;
}

interface AuditLog {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  isAdminOverride: boolean;
  createdAt: string;
  question: { id: string; serialNo: number; checklistItem: string };
  changedBy: { id: string; name: string; email: string; role: string };
}

export default function AdminHotelDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editCompletedDate, setEditCompletedDate] = useState<
    Date | undefined
  >();
  const [editRemark, setEditRemark] = useState<string>("");

  const [showAuditLog, setShowAuditLog] = useState(false);

  const { data: hotelData, isLoading } = useQuery({
    queryKey: ["admin", "hotel", id],
    queryFn: () => adminApi.getHotelDetail(id!),
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ["admin", "audit-logs", id],
    queryFn: () => adminApi.getAuditLogs(id!),
    enabled: !!id && showAuditLog,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: adminApi.getDepartments,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.getCategories,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string;
      data: {
        status: string;
        estimatedDate?: string | null;
        completedDate?: string | null;
        remark?: string | null;
      };
    }) => adminApi.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hotel", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs", id] });
      setEditDialogOpen(false);
      setSelectedTask(null);
      setEditRemark("");
      setEditCompletedDate(undefined);
      toast.success("Task updated successfully");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const hotel = hotelData?.data?.hotel;
  const tasks: Task[] = hotelData?.data?.tasks || [];
  const departments = departmentsData?.data || [];
  const categories = categoriesData?.data || [];
  const auditLogs: AuditLog[] = auditData?.data || [];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (departmentFilter !== "all" && task.department.id !== departmentFilter)
        return false;
      if (categoryFilter !== "all" && task.category.id !== categoryFilter)
        return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, departmentFilter, categoryFilter, statusFilter]);

  // Calculate stats with scoring
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const notApplicable = tasks.filter(
      (t) => t.status === "NOT_APPLICABLE"
    ).length;

    // Calculate scoring-based percentage
    const totalScore = tasks.reduce((sum, t) => sum + t.scoring, 0);
    // Full score for DONE, half score for IN_PROGRESS
    const doneScore = tasks
      .filter((t) => t.status === "DONE")
      .reduce((sum, t) => sum + t.scoring, 0);
    const inProgressScore = tasks
      .filter((t) => t.status === "IN_PROGRESS")
      .reduce((sum, t) => sum + t.scoring / 2, 0);
    const completedScore = doneScore + inProgressScore;
    const naScore = tasks
      .filter((t) => t.status === "NOT_APPLICABLE")
      .reduce((sum, t) => sum + t.scoring, 0);

    const applicableScore = totalScore - naScore;

    return {
      total,
      pending,
      inProgress,
      done,
      notApplicable,
      totalScore,
      completedScore,
      percentage:
        applicableScore > 0
          ? Math.round((completedScore / applicableScore) * 100)
          : 0,
    };
  }, [tasks]);

  // Data for donut chart (overall progress)
  const donutChartData = useMemo(() => {
    return [
      { name: "Completed", value: stats.done, color: "#22c55e" },
      { name: "In Progress", value: stats.inProgress, color: "#eab308" },
      { name: "Pending", value: stats.pending, color: "#ef4444" },
      { name: "N/A", value: stats.notApplicable, color: "#9ca3af" },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Data for bar chart (status breakdown)
  const barChartData = useMemo(() => {
    return [
      { name: "Pending", count: stats.pending, fill: "#ef4444" },
      { name: "In Progress", count: stats.inProgress, fill: "#eab308" },
      { name: "Completed", count: stats.done, fill: "#22c55e" },
      { name: "N/A", count: stats.notApplicable, fill: "#9ca3af" },
    ];
  }, [stats]);

  // Word cloud data from High, Very High, and Med importance tasks
  const wordCloudData = useMemo(() => {
    const keywordCounts: Record<string, number> = {};

    tasks
      .filter((t) => {
        const importance = t.importance?.trim();
        return (
          importance === "High" ||
          importance === "Very High" ||
          importance === "Med"
        );
      })
      .forEach((task) => {
        const keywords = Array.isArray(task.keyWords) ? task.keyWords : [];
        keywords.forEach((keyword) => {
          if (typeof keyword === "string" && keyword.trim()) {
            const normalizedKeyword = keyword.trim().toLowerCase();
            keywordCounts[normalizedKeyword] =
              (keywordCounts[normalizedKeyword] || 0) + 1;
          }
        });
      });

    const sortedKeywords = Object.entries(keywordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30); // Top 30 keywords

    if (sortedKeywords.length === 0) {
      return [];
    }

    const maxCount = Math.max(...sortedKeywords.map((k) => k.count), 1);

    return sortedKeywords.map((item) => ({
      ...item,
      size: Math.max(0.6, item.count / maxCount), // Normalized size between 0.6 and 1
    }));
  }, [tasks]);

  const handleEditTask = (task: Task) => {
    if (!task.taskProgressId) {
      toast.error("This task has not been started yet");
      return;
    }
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditDate(task.estimatedDate ? new Date(task.estimatedDate) : undefined);
    setEditCompletedDate(
      task.completedDate ? new Date(task.completedDate) : undefined
    );
    setEditRemark(task.remark || "");
    setEditDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!selectedTask?.taskProgressId) return;
    updateTaskMutation.mutate({
      taskId: selectedTask.taskProgressId,
      data: {
        status: editStatus,
        estimatedDate: editDate ? editDate.toISOString() : null,
        completedDate: editCompletedDate
          ? editCompletedDate.toISOString()
          : null,
        remark: editRemark || null,
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hotel) {
    return (
      <DashboardLayout title="Hotel Not Found">
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Hotel not found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The hotel you're looking for doesn't exist
          </p>
          <Button asChild className="mt-4">
            <Link to="/admin">Back to Hotels</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={hotel.name}
      description={`${hotel.code} • ${hotel.address}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAuditLog(!showAuditLog)}
          >
            <History className="h-4 w-4 mr-2" />
            {showAuditLog ? "Hide" : "Show"} Audit Log
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Readiness of the Hotel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={stats.percentage} className="h-2 flex-1" />
              <span className="text-lg font-bold">{stats.percentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {stats.completedScore.toFixed(1)} /{" "}
              {(
                stats.totalScore -
                tasks
                  .filter((t) => t.status === "NOT_APPLICABLE")
                  .reduce((sum, t) => sum + t.scoring, 0)
              ).toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.done}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">N/A</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.notApplicable}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Section */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* Donut Chart - Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <CardDescription>Task completion breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} tasks`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2 flex-wrap">
              {donutChartData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Status Distribution
            </CardTitle>
            <CardDescription>Tasks by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} tasks`, "Count"]}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={35}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Word Cloud - Keywords */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Priority Keywords
            </CardTitle>
            <CardDescription>
              From High, Very High & Med importance tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] overflow-auto">
              {wordCloudData.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center items-center p-2">
                  {wordCloudData.map((item, index) => {
                    // Generate colors based on importance
                    const colors = [
                      "#dc2626",
                      "#ea580c",
                      "#d97706",
                      "#ca8a04",
                      "#65a30d",
                      "#16a34a",
                      "#0891b2",
                      "#0284c7",
                      "#2563eb",
                      "#7c3aed",
                      "#c026d3",
                      "#db2777",
                    ];
                    const color = colors[index % colors.length];
                    const fontSize = Math.round(12 + item.size * 16); // 12px to 28px

                    return (
                      <span
                        key={item.word}
                        className="inline-block px-2 py-1 rounded-md transition-transform hover:scale-110 cursor-default"
                        style={{
                          fontSize: `${fontSize}px`,
                          color: color,
                          fontWeight: item.size > 0.7 ? 600 : 400,
                          opacity: 0.7 + item.size * 0.3,
                        }}
                        title={`${item.word}: ${item.count} occurrence${
                          item.count > 1 ? "s" : ""
                        }`}
                      >
                        {item.word}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No keywords found for priority tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Info */}
      {hotel.user && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Partner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">{hotel.user.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{hotel.user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks ({filteredTasks.length})
          </TabsTrigger>
          {showAuditLog && (
            <TabsTrigger value="audit">
              Audit Log ({auditLogs.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">
                    Department
                  </Label>
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((d: { id: string; name: string }) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">
                    Category
                  </Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c: { id: string; name: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Completed</SelectItem>
                      <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Checklist Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Importance</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Est. Date</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.questionId}>
                      <TableCell className="font-mono text-muted-foreground">
                        {task.serialNo}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <span className="line-clamp-2">
                          {task.checklistItem}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.category.name}
                      </TableCell>
                      <TableCell>
                        <ImportanceBadge importance={task.importance} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {task.scoring}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(task.estimatedDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(task.completedDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                        {task.remark ? (
                          <span className="line-clamp-2" title={task.remark}>
                            {task.remark}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          disabled={!task.taskProgressId}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {showAuditLog && (
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  History of all status changes for this hotel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Override</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <span className="text-xs text-muted-foreground">
                              #{log.question.serialNo}
                            </span>
                            <p className="text-sm line-clamp-1">
                              {log.question.checklistItem}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.previousStatus ? (
                            <StatusBadge status={log.previousStatus} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={log.newStatus} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{log.changedBy.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.changedBy.role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.isAdminOverride && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              Override
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No audit logs yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task Status</DialogTitle>
            <DialogDescription>
              #{selectedTask?.serialNo}: {selectedTask?.checklistItem}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Completed</SelectItem>
                  <SelectItem value="NOT_APPLICABLE">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editStatus === "NOT_APPLICABLE" && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Marking this task as N/A will exclude it from the completion
                  score calculation.
                </p>
              </div>
            )}
            {(editStatus === "IN_PROGRESS" || editStatus === "PENDING") && (
              <div className="space-y-2">
                <Label>Estimated Completion Date</Label>
                <DatePicker
                  date={editDate}
                  onDateChange={setEditDate}
                  placeholder="Select date"
                />
              </div>
            )}
            {editStatus === "DONE" && (
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <DatePicker
                  date={editCompletedDate}
                  onDateChange={setEditCompletedDate}
                  placeholder="Select completion date"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Remark</Label>
              <Textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="Add any notes or remarks..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
