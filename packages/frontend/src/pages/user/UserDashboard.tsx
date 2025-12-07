import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Clock, AlertCircle, ArrowRight, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { getNextAllowedStatuses, TASK_STATUS_LABELS } from '@sarovar/shared'

interface Task {
  questionId: string
  serialNo: number
  checklistItem: string
  category: { id: string; name: string }
  department: { id: string; name: string }
  taskProgressId: string | null
  status: string
  estimatedDate: string | null
  updatedAt: string | null
}

interface DepartmentProgress {
  departmentId: string
  departmentName: string
  total: number
  pending: number
  inProgress: number
  completed: number
  percentage: number
}

const CHART_COLORS = {
  PENDING: '#ef4444',
  IN_PROGRESS: '#eab308',
  DONE: '#22c55e',
}

export default function UserDashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [estimatedDate, setEstimatedDate] = useState<Date | undefined>()

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: userApi.getDashboard,
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['user', 'tasks'],
    queryFn: () => userApi.getTasks(),
  })

  const { data: departmentsData } = useQuery({
    queryKey: ['user', 'departments'],
    queryFn: userApi.getDepartments,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['user', 'categories'],
    queryFn: userApi.getCategories,
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: { status: string; estimatedDate?: string | null } }) =>
      userApi.updateTask(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setUpdateDialogOpen(false)
      setSelectedTask(null)
      toast.success('Task updated successfully!')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      toast.error(message)
    },
  })

  const stats = dashboardData?.data
  const tasks: Task[] = tasksData?.data || []
  const departments = departmentsData?.data || []
  const categories = categoriesData?.data || []
  const departmentProgress: DepartmentProgress[] = stats?.departmentProgress || []

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (departmentFilter !== 'all' && task.department.id !== departmentFilter) return false
      if (categoryFilter !== 'all' && task.category.id !== categoryFilter) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      return true
    })
  }, [tasks, departmentFilter, categoryFilter, statusFilter])

  // Chart data
  const pieData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'Pending', value: stats.pendingTasks, color: CHART_COLORS.PENDING },
      { name: 'In Progress', value: stats.inProgressTasks, color: CHART_COLORS.IN_PROGRESS },
      { name: 'Completed', value: stats.completedTasks, color: CHART_COLORS.DONE },
    ]
  }, [stats])

  const handleUpdateTask = (task: Task) => {
    setSelectedTask(task)
    const allowedStatuses = getNextAllowedStatuses(task.status, false)
    setNewStatus(allowedStatuses[0] || task.status)
    setEstimatedDate(task.estimatedDate ? new Date(task.estimatedDate) : undefined)
    setUpdateDialogOpen(true)
  }

  const handleSaveTask = () => {
    if (!selectedTask) return
    
    // Validate estimated date when moving to IN_PROGRESS
    if (newStatus === 'IN_PROGRESS' && !estimatedDate && !selectedTask.estimatedDate) {
      toast.error('Please select an estimated completion date')
      return
    }

    updateTaskMutation.mutate({
      questionId: selectedTask.questionId,
      data: {
        status: newStatus,
        estimatedDate: estimatedDate ? estimatedDate.toISOString() : null,
      },
    })
  }

  const allowedStatuses = selectedTask ? getNextAllowedStatuses(selectedTask.status, false) : []

  if (dashboardLoading || tasksLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name}`}
      description={user?.hotel ? `${user.hotel.name} (${user.hotel.code})` : 'Hotel Progress Tracker'}
    >
      {/* Overview Section */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Progress Chart */}
        <Card className="md:col-span-1 opacity-0 animate-fade-in stagger-1">
          <CardHeader>
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold text-primary">{stats?.progressPercentage || 0}%</span>
              <span className="text-sm text-muted-foreground ml-2">Complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="md:col-span-2 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="opacity-0 animate-fade-in stagger-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            </CardContent>
          </Card>
          <Card className="opacity-0 animate-fade-in stagger-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.pendingTasks || 0}</div>
            </CardContent>
          </Card>
          <Card className="opacity-0 animate-fade-in stagger-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.inProgressTasks || 0}</div>
            </CardContent>
          </Card>
          <Card className="opacity-0 animate-fade-in stagger-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Department Progress */}
      <Card className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle>Department Progress</CardTitle>
          <CardDescription>Progress breakdown by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentProgress.map((dept) => (
              <div key={dept.departmentId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.departmentName}</span>
                  <span className="text-muted-foreground">
                    {dept.completed}/{dept.total} ({dept.percentage}%)
                  </span>
                </div>
                <Progress value={dept.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
          </TabsList>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d: { id: string; name: string }) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all" className="mt-4">
          <TasksTable tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <TasksTable 
            tasks={filteredTasks.filter(t => t.status === 'PENDING')} 
            onUpdateTask={handleUpdateTask} 
          />
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          <TasksTable 
            tasks={filteredTasks.filter(t => t.status === 'IN_PROGRESS')} 
            onUpdateTask={handleUpdateTask} 
          />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <TasksTable 
            tasks={filteredTasks.filter(t => t.status === 'DONE')} 
            onUpdateTask={handleUpdateTask} 
            showUpdateButton={false}
          />
        </TabsContent>
      </Tabs>

      {/* Update Task Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              #{selectedTask?.serialNo}: {selectedTask?.checklistItem}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <StatusBadge status={selectedTask?.status || ''} className="mt-1" />
            </div>
            
            {allowedStatuses.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {TASK_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(newStatus === 'IN_PROGRESS' || selectedTask?.status === 'IN_PROGRESS') && (
                  <div className="space-y-2">
                    <Label>Estimated Completion Date {newStatus === 'IN_PROGRESS' && '*'}</Label>
                    <DatePicker
                      date={estimatedDate}
                      onDateChange={setEstimatedDate}
                      placeholder="Select estimated date"
                    />
                    {newStatus === 'IN_PROGRESS' && (
                      <p className="text-xs text-muted-foreground">Required when starting a task</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>This task is already completed!</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            {allowedStatuses.length > 0 && (
              <Button onClick={handleSaveTask} disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

interface TasksTableProps {
  tasks: Task[]
  onUpdateTask: (task: Task) => void
  showUpdateButton?: boolean
}

function TasksTable({ tasks, onUpdateTask, showUpdateButton = true }: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Checklist Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Est. Date</TableHead>
              {showUpdateButton && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.questionId}>
                <TableCell className="font-mono text-muted-foreground">
                  {task.serialNo}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <span className="line-clamp-2">{task.checklistItem}</span>
                </TableCell>
                <TableCell className="text-sm">{task.category.name}</TableCell>
                <TableCell className="text-sm">{task.department.name}</TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(task.estimatedDate)}
                </TableCell>
                {showUpdateButton && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateTask(task)}
                      disabled={task.status === 'DONE'}
                    >
                      Update
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

