import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Ban,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Hotel {
  id: string;
  name: string;
  code: string;
  address: string;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  notApplicableTasks: number;
  totalScore: number;
  completedScore: number;
  progressPercentage: number;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    partnerEmail: "",
    partnerName: "",
  });

  const { data: hotelsData, isLoading } = useQuery({
    queryKey: ["admin", "hotels"],
    queryFn: adminApi.getHotels,
  });

  const createHotelMutation = useMutation({
    mutationFn: adminApi.createHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hotels"] });
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        code: "",
        address: "",
        partnerEmail: "",
        partnerName: "",
      });
      toast.success(
        "Hotel created successfully! Password reset email will be sent to the partner."
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create hotel";
      toast.error(message);
    },
  });

  const hotels: Hotel[] = hotelsData?.data || [];

  // Calculate summary stats
  const totalHotels = hotels.length;
  const totalCompleted = hotels.reduce((sum, h) => sum + h.completedTasks, 0);
  const totalInProgress = hotels.reduce((sum, h) => sum + h.inProgressTasks, 0);
  const totalPending = hotels.reduce((sum, h) => sum + h.pendingTasks, 0);
  const totalNA = hotels.reduce(
    (sum, h) => sum + (h.notApplicableTasks || 0),
    0
  );

  const handleCreateHotel = (e: React.FormEvent) => {
    e.preventDefault();
    createHotelMutation.mutate(formData);
  };

  return (
    <DashboardLayout
      title="Hotels Dashboard"
      description="Manage and monitor all hotel onboarding progress"
      actions={
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateHotel}>
              <DialogHeader>
                <DialogTitle>Add New Hotel</DialogTitle>
                <DialogDescription>
                  Create a new hotel and partner account. The partner will
                  receive an email to set their password.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hotel Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Grand Hotel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Hotel Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="GH001"
                      required
                      maxLength={20}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street, City"
                    required
                  />
                </div>
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3">Partner Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partnerName">Partner Name</Label>
                      <Input
                        id="partnerName"
                        value={formData.partnerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerName: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partnerEmail">Partner Email</Label>
                      <Input
                        id="partnerEmail"
                        type="email"
                        value={formData.partnerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partnerEmail: e.target.value,
                          })
                        }
                        placeholder="partner@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createHotelMutation.isPending}>
                  {createHotelMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Hotel"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="opacity-0 animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHotels}</div>
            <p className="text-xs text-muted-foreground">Active properties</p>
          </CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCompleted}
            </div>
            <p className="text-xs text-muted-foreground">Across all hotels</p>
          </CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totalInProgress}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in stagger-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalPending}
            </div>
            <p className="text-xs text-muted-foreground">Not yet started</p>
          </CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in stagger-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">N/A</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{totalNA}</div>
            <p className="text-xs text-muted-foreground">Not applicable</p>
          </CardContent>
        </Card>
      </div>

      {/* Hotels Table */}
      <Card
        className="opacity-0 animate-fade-in"
        style={{ animationDelay: "0.3s" }}
      >
        <CardHeader>
          <CardTitle>All Hotels</CardTitle>
          <CardDescription>
            View and manage hotel onboarding progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hotels yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get started by adding your first hotel
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">In Progress</TableHead>
                  <TableHead className="text-center">Done</TableHead>
                  <TableHead className="text-center">N/A</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{hotel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {hotel.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hotel.user ? (
                        <div>
                          <div className="text-sm">{hotel.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {hotel.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[150px]">
                      <div className="flex items-center gap-3">
                        <Progress
                          value={hotel.progressPercentage}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium w-10">
                          {hotel.progressPercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">
                        {hotel.pendingTasks}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-yellow-600 font-medium">
                        {hotel.inProgressTasks}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">
                        {hotel.completedTasks}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-gray-600 font-medium">
                        {hotel.notApplicableTasks || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(hotel.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/hotels/${hotel.id}`}>
                          View
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
