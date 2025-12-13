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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Ban,
  ChevronsUpDown,
  Check,
  Search,
  CalendarDays,
  Calendar,
  Edit2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate, getDaysRemaining } from "@/lib/utils";

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

interface DepartmentProgress {
  departmentId: string;
  departmentName: string;
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  notApplicable: number;
  totalScore: number;
  completedScore: number;
  percentage: number;
}

interface SoftOpeningData {
  hotelId: string;
  hotelName: string;
  hotelCode: string;
  softOpeningDate: string | null;
  isSubmitted: boolean;
  partner: { id: string; name: string; email: string } | null;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>("all");
  const [hotelSearchOpen, setHotelSearchOpen] = useState(false);
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");

  // Soft opening date edit state
  const [editSoftOpeningDialogOpen, setEditSoftOpeningDialogOpen] =
    useState(false);
  const [selectedHotelForEdit, setSelectedHotelForEdit] =
    useState<SoftOpeningData | null>(null);
  const [editSoftOpeningDate, setEditSoftOpeningDate] = useState<
    Date | undefined
  >();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    partnerEmail: "",
    partnerName: "",
    // Optional hotel facility details
    allDayDining: "",
    restoBar: "",
    banquetingIndoor: "",
    banquetingOutdoor: "",
    fitnessCentre: "",
    kidsArea: "",
    spa: "",
  });

  const { data: hotelsData, isLoading } = useQuery({
    queryKey: ["admin", "hotels"],
    queryFn: adminApi.getHotels,
  });

  const { data: departmentStatsData } = useQuery({
    queryKey: ["admin", "department-stats", selectedHotelFilter],
    queryFn: () =>
      adminApi.getDepartmentStats(
        selectedHotelFilter !== "all" ? selectedHotelFilter : undefined
      ),
  });

  // Soft opening dates query
  const { data: softOpeningDatesData, isLoading: softOpeningLoading } =
    useQuery({
      queryKey: ["admin", "soft-opening-dates"],
      queryFn: adminApi.getSoftOpeningDates,
    });

  // Soft opening date update mutation
  const updateSoftOpeningMutation = useMutation({
    mutationFn: ({ hotelId, date }: { hotelId: string; date: string }) =>
      adminApi.updateSoftOpeningDate(hotelId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "soft-opening-dates"],
      });
      setEditSoftOpeningDialogOpen(false);
      setSelectedHotelForEdit(null);
      setEditSoftOpeningDate(undefined);
      toast.success("Soft opening date updated successfully!");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update soft opening date";
      toast.error(message);
    },
  });

  const createHotelMutation = useMutation({
    mutationFn: adminApi.createHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hotels"] });
      setCreateDialogOpen(false);
      setFormStep(1);
      setFormData({
        name: "",
        code: "",
        address: "",
        partnerEmail: "",
        partnerName: "",
        allDayDining: "",
        restoBar: "",
        banquetingIndoor: "",
        banquetingOutdoor: "",
        fitnessCentre: "",
        kidsArea: "",
        spa: "",
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
  const departmentProgress: DepartmentProgress[] =
    departmentStatsData?.data || [];
  const softOpeningDates: SoftOpeningData[] = softOpeningDatesData?.data || [];

  // Handler for editing soft opening date
  const handleEditSoftOpeningDate = (hotel: SoftOpeningData) => {
    setSelectedHotelForEdit(hotel);
    setEditSoftOpeningDate(
      hotel.softOpeningDate ? new Date(hotel.softOpeningDate) : undefined
    );
    setEditSoftOpeningDialogOpen(true);
  };

  const handleSaveSoftOpeningDate = () => {
    if (!selectedHotelForEdit || !editSoftOpeningDate) {
      toast.error("Please select a date");
      return;
    }
    updateSoftOpeningMutation.mutate({
      hotelId: selectedHotelForEdit.hotelId,
      date: editSoftOpeningDate.toISOString(),
    });
  };

  // Calculate summary stats
  const totalHotels = hotels.length;
  const totalCompleted = hotels.reduce((sum, h) => sum + h.completedTasks, 0);
  const totalInProgress = hotels.reduce((sum, h) => sum + h.inProgressTasks, 0);
  const totalPending = hotels.reduce((sum, h) => sum + h.pendingTasks, 0);
  const totalNA = hotels.reduce(
    (sum, h) => sum + (h.notApplicableTasks || 0),
    0
  );

  const handleNextStep = () => {
    // Validate required fields before moving to step 2
    if (
      !formData.name ||
      !formData.code ||
      !formData.address ||
      !formData.partnerName ||
      !formData.partnerEmail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setFormStep(2);
  };

  const handlePrevStep = () => {
    setFormStep(1);
  };

  const handleCreateHotel = () => {
    // Filter out empty optional fields
    const submitData = {
      name: formData.name,
      code: formData.code,
      address: formData.address,
      partnerEmail: formData.partnerEmail,
      partnerName: formData.partnerName,
      ...(formData.allDayDining && { allDayDining: formData.allDayDining }),
      ...(formData.restoBar && { restoBar: formData.restoBar }),
      ...(formData.banquetingIndoor && {
        banquetingIndoor: formData.banquetingIndoor,
      }),
      ...(formData.banquetingOutdoor && {
        banquetingOutdoor: formData.banquetingOutdoor,
      }),
      ...(formData.fitnessCentre && { fitnessCentre: formData.fitnessCentre }),
      ...(formData.kidsArea && { kidsArea: formData.kidsArea }),
      ...(formData.spa && { spa: formData.spa }),
    };
    createHotelMutation.mutate(submitData);
  };

  const handleDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setFormStep(1);
    }
  };

  return (
    <DashboardLayout
      title="Hotels Dashboard"
      description="Manage and monitor all hotel onboarding progress"
      actions={
        <Dialog open={createDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <div>
              <DialogHeader>
                <DialogTitle>Add New Hotel</DialogTitle>
                <DialogDescription>
                  {formStep === 1
                    ? "Step 1 of 2: Enter basic hotel and partner information (required)"
                    : "Step 2 of 2: Enter facility details (optional)"}
                </DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center gap-2 py-4">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    formStep >= 1 ? "bg-primary" : "bg-muted"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    formStep >= 2 ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>

              {/* Step 1: Required fields */}
              {formStep === 1 && (
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Hotel Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Grand Hotel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">
                        Hotel Code <span className="text-red-500">*</span>
                      </Label>
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
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="123 Main Street, City"
                    />
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm font-medium mb-3">
                      General Manager Details
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">
                          Name <span className="text-red-500">*</span>
                        </Label>
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerEmail">
                          Email <span className="text-red-500">*</span>
                        </Label>
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
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Optional facility details */}
              {formStep === 2 && (
                <div className="grid gap-4 py-2 max-h-[400px] overflow-y-auto">
                  <p className="text-sm text-muted-foreground">
                    Add facility details for this hotel. All fields are
                    optional.
                  </p>
                  <div className="grid grid-cols-2 gap-4 px-1">
                    <div className="space-y-2">
                      <Label htmlFor="allDayDining">All Day Dining</Label>
                      <Input
                        id="allDayDining"
                        value={formData.allDayDining}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allDayDining: e.target.value,
                          })
                        }
                        placeholder="e.g., 75 covers"
                      />
                    </div>
                    <div className="space-y-2 px-1">
                      <Label htmlFor="restoBar">Resto Bar</Label>
                      <Input
                        id="restoBar"
                        value={formData.restoBar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            restoBar: e.target.value,
                          })
                        }
                        placeholder="e.g., 45 covers"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 px-1">
                    <div className="space-y-2">
                      <Label htmlFor="banquetingIndoor">
                        Banqueting - Indoor
                      </Label>
                      <Input
                        id="banquetingIndoor"
                        value={formData.banquetingIndoor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            banquetingIndoor: e.target.value,
                          })
                        }
                        placeholder="e.g., 5000 Sq Ft"
                      />
                    </div>
                    <div className="space-y-2 px-1">
                      <Label htmlFor="banquetingOutdoor">
                        Banqueting - Outdoor
                      </Label>
                      <Input
                        id="banquetingOutdoor"
                        value={formData.banquetingOutdoor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            banquetingOutdoor: e.target.value,
                          })
                        }
                        placeholder="e.g., 3000 Sq Ft or NA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 px-1">
                      <Label htmlFor="fitnessCentre">Fitness Centre</Label>
                      <Input
                        id="fitnessCentre"
                        value={formData.fitnessCentre}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fitnessCentre: e.target.value,
                          })
                        }
                        placeholder="e.g., Available or NA"
                      />
                    </div>
                    <div className="space-y-2 px-1">
                      <Label htmlFor="kidsArea">Kids Area</Label>
                      <Input
                        id="kidsArea"
                        value={formData.kidsArea}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kidsArea: e.target.value,
                          })
                        }
                        placeholder="e.g., 2500 Sqft"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 px-1">
                    <Label htmlFor="spa">Spa</Label>
                    <Input
                      id="spa"
                      value={formData.spa}
                      onChange={(e) =>
                        setFormData({ ...formData, spa: e.target.value })
                      }
                      placeholder="e.g., By Tatva (3 Beds)"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4">
                {formStep === 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleNextStep}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateHotel}
                      disabled={createHotelMutation.isPending}
                    >
                      {createHotelMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Hotel"
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Summary Cards */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
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
      </div> */}

      {/* Main Content Tabs */}
      <Tabs defaultValue="hotels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="hotels" className="gap-2">
            <Building2 className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="soft-opening" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Soft Opening Dates
          </TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-6">
          {/* Hotels Table */}
          <Card
            className="opacity-0 animate-fade-in mb-8"
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
        </TabsContent>

        {/* Soft Opening Dates Tab */}
        <TabsContent value="soft-opening" className="space-y-6">
          <Card
            className="opacity-0 animate-fade-in mb-8"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Soft Opening Dates</CardTitle>
                  <CardDescription>
                    View and manage expected soft opening dates for all hotels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {softOpeningLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : softOpeningDates.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No hotels yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hotels will appear here once added
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Soft Opening Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {softOpeningDates.map((hotel) => {
                      const remaining = hotel.softOpeningDate
                        ? getDaysRemaining(hotel.softOpeningDate)
                        : { status: "none" as const, label: "-" };

                      return (
                        <TableRow key={hotel.hotelId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {hotel.hotelName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {hotel.hotelCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {hotel.partner ? (
                              <div>
                                <div className="text-sm">
                                  {hotel.partner.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {hotel.partner.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hotel.softOpeningDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatDate(hotel.softOpeningDate)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Not set
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {remaining.status !== "none" ? (
                              <span
                                className={`font-medium ${
                                  remaining.status === "overdue"
                                    ? "text-red-600"
                                    : remaining.status === "urgent"
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {remaining.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hotel.isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSoftOpeningDate(hotel)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Soft Opening Date Dialog */}
      <Dialog
        open={editSoftOpeningDialogOpen}
        onOpenChange={setEditSoftOpeningDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Soft Opening Date</DialogTitle>
            <DialogDescription>
              {selectedHotelForEdit && (
                <>
                  Update the expected soft opening date for{" "}
                  <span className="font-semibold">
                    {selectedHotelForEdit.hotelName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Soft Opening Date</Label>
            <DatePicker
              date={editSoftOpeningDate}
              onDateChange={setEditSoftOpeningDate}
              placeholder="Select soft opening date"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditSoftOpeningDialogOpen(false);
                setSelectedHotelForEdit(null);
                setEditSoftOpeningDate(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSoftOpeningDate}
              disabled={
                !editSoftOpeningDate || updateSoftOpeningMutation.isPending
              }
            >
              {updateSoftOpeningMutation.isPending ? (
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

      {/* Department Progress */}
      <Card
        className="mb-8 opacity-0 animate-fade-in"
        style={{ animationDelay: "0.25s" }}
      >
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Progress by Department</CardTitle>
              <CardDescription>
                {selectedHotelFilter === "all"
                  ? "Overall progress breakdown by department across all hotels"
                  : `Progress breakdown for ${
                      hotels.find((h) => h.id === selectedHotelFilter)?.name ||
                      "selected hotel"
                    }`}
              </CardDescription>
            </div>
            <Popover open={hotelSearchOpen} onOpenChange={setHotelSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={hotelSearchOpen}
                  className="w-[300px] justify-between"
                >
                  {selectedHotelFilter === "all"
                    ? "All Hotels"
                    : hotels.find((h) => h.id === selectedHotelFilter)?.name ||
                      "Select hotel..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search hotels..."
                    value={hotelSearchQuery}
                    onChange={(e) => setHotelSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full bg-transparent"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  <div
                    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                      selectedHotelFilter === "all" ? "bg-accent" : ""
                    }`}
                    onClick={() => {
                      setSelectedHotelFilter("all");
                      setHotelSearchOpen(false);
                      setHotelSearchQuery("");
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedHotelFilter === "all"
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    All Hotels
                  </div>
                  {hotels
                    .filter((hotel) =>
                      hotel.name
                        .toLowerCase()
                        .includes(hotelSearchQuery.toLowerCase())
                    )
                    .map((hotel) => (
                      <div
                        key={hotel.id}
                        className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                          selectedHotelFilter === hotel.id ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          setSelectedHotelFilter(hotel.id);
                          setHotelSearchOpen(false);
                          setHotelSearchQuery("");
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedHotelFilter === hotel.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {hotel.name}
                      </div>
                    ))}
                  {hotels.filter((hotel) =>
                    hotel.name
                      .toLowerCase()
                      .includes(hotelSearchQuery.toLowerCase())
                  ).length === 0 &&
                    hotelSearchQuery && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No hotels found
                      </div>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {departmentProgress.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departmentProgress.map((dept) => (
                <div
                  key={dept.departmentId}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {dept.departmentName}
                    </span>
                    <span className="text-sm font-bold">
                      {dept.percentage}%
                    </span>
                  </div>
                  <Progress value={dept.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {dept.completed} done, {dept.inProgress} in progress
                    </span>
                    <span>{dept.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No department data available
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
