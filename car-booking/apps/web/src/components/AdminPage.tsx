'use client';

import { useState } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Car, User, Plus, Edit3, Trash2, Settings, Save, X, Upload, Link, Image, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import { Skeleton } from '@ui/skeleton';

interface User {
  name: string;
  email: string;
  role: string;
}

interface CarData {
  id: string;
  name: string;
  type: string;
  seats: number;
  licensePlate: string;
  imageUrl: string | null;
  status: 'available' | 'booked' | 'maintenance';
}

interface AdminPageProps {
  user: User;
  onLogout: () => void;
}


const CAR_TYPES = ['Sedan', 'SUV', 'Compact', 'Large SUV', 'Van', 'Pickup Truck'];
const SEAT_OPTIONS = [2, 4, 5, 7, 8, 9, 12, 15];
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'booked', label: 'In Use', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-red-100 text-red-800' }
];

export function AdminPage({ user, onLogout }: AdminPageProps) {
  const [editingCar, setEditingCar] = useState<any | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CarData>>({
    name: '',
    type: '',
    seats: 5,
    licensePlate: '',
    imageUrl: '',
    status: 'available'
  });
  
  // Fetch vehicles using tRPC
  const { data: cars = [], isLoading, error, refetch } = trpc.vehicles.list.useQuery();
  
  // Maintenance mutation
  const maintenanceMutation = trpc.vehicles.setMaintenance.useMutation({
    onSuccess: () => {
      toast.success('Vehicle status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update vehicle status: ${error.message}`);
    }
  });

  const handleAddCar = () => {
    setFormData({
      name: '',
      type: '',
      seats: 5,
      licensePlate: '',
      imageUrl: '',
      status: 'available'
    });
    setSelectedFile(null);
    setImagePreview('');
    setIsAddDialogOpen(true);
  };

  const handleEditCar = (car: CarData) => {
    setEditingCar(car);
    setFormData({ ...car });
    setSelectedFile(null);
    setImagePreview('');
    setIsEditDialogOpen(true);
  };

  const handleDeleteCar = async (carId: string) => {
    // Note: In a real app, you'd have a delete mutation
    // For now, we'll just toggle maintenance status
    const car = cars.find(c => c.id === carId);
    if (car) {
      await maintenanceMutation.mutateAsync({
        vehicleId: carId,
        inMaintenance: true
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type || !formData.licensePlate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingCar) {
      // For now, we can only toggle maintenance status
      if (editingCar.status !== formData.status) {
        await maintenanceMutation.mutateAsync({
          vehicleId: editingCar.id,
          inMaintenance: formData.status === 'maintenance'
        });
      }
      setIsEditDialogOpen(false);
    } else {
      // Note: In a real app, you'd have an add vehicle mutation
      toast.info('Vehicle creation requires backend API implementation');
      setIsAddDialogOpen(false);
    }
    
    setEditingCar(null);
    setFormData({
      name: '',
      type: '',
      seats: 5,
      licensePlate: '',
      imageUrl: '',
      status: 'available'
    });
  };

  const handleCancel = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingCar(null);
    setSelectedFile(null);
    setImagePreview('');
    setFormData({
      name: '',
      type: '',
      seats: 5,
      licensePlate: '',
      imageUrl: '',
      status: 'available'
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreview(result);
          // In a real app, you would upload to cloud storage and get a URL
          // For demo purposes, we'll use the preview URL
          setFormData(prev => ({ ...prev, imageUrl: result }));
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file (JPG, PNG, etc.)');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview('');
    // Reset to URL if available, otherwise clear
    if (editingCar?.imageUrl && !editingCar.imageUrl.startsWith('data:')) {
      setFormData(prev => ({ ...prev, imageUrl: editingCar.imageUrl }));
    } else {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
    return statusConfig ? statusConfig : STATUS_OPTIONS[0];
  };

  const CarForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="car-name">Car Name *</Label>
        <Input
          id="car-name"
          placeholder="e.g., Toyota Camry"
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="car-type">Car Type *</Label>
        <Select 
          value={formData.type || ''} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select car type" />
          </SelectTrigger>
          <SelectContent>
            {CAR_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="car-seats">Number of Seats *</Label>
        <Select 
          value={formData.seats?.toString() || '5'} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, seats: parseInt(value) }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select seats" />
          </SelectTrigger>
          <SelectContent>
            {SEAT_OPTIONS.map(seats => (
              <SelectItem key={seats} value={seats.toString()}>{seats} seats</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="license-plate">License Plate *</Label>
        <Input
          id="license-plate"
          placeholder="e.g., กข 1234 กรุงเทพมหานคร"
          value={formData.licensePlate || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Car Image</Label>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl?.startsWith('data:') ? '' : formData.imageUrl || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
                setSelectedFile(null);
                setImagePreview('');
              }}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-muted file:text-muted-foreground hover:file:bg-accent"
                />
                {selectedFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                )}
              </div>
              
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor="car-status">Status</Label>
        <Select 
          value={formData.status || 'available'} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as CarData['status'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.imageUrl && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="aspect-video w-32 overflow-hidden rounded-md border">
            <ImageWithFallback
              src={formData.imageUrl}
              alt="Car preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo removed */}
            <div className="h-6 w-px bg-border" />
            <Settings className="h-6 w-6" />
            <h1>Admin Panel - Car Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                {user.role}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2>Vehicle Fleet Management</h2>
            <p className="text-muted-foreground">Manage company vehicles and their availability</p>
          </div>
          <Button onClick={handleAddCar} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Car
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cars</p>
                  <p className="text-xl font-medium">{cars.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-xl font-medium">{cars.filter(c => c.status === 'available').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-muted-foreground">In Use</p>
                  <p className="text-xl font-medium">{cars.filter(c => c.status === 'booked').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-xl font-medium">{cars.filter(c => c.status === 'maintenance').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cars List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-video mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-destructive mb-4">Failed to load vehicles</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => {
            const statusConfig = getStatusBadge(car.status);
            
            return (
              <Card key={car.id}>
                <CardContent className="p-4">
                  <div className="aspect-video mb-3 overflow-hidden rounded-md">
                    <ImageWithFallback
                      src={car.imageUrl || '/placeholder-car.jpg'}
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4>{car.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{car.type} • {car.seats} seats</p>
                    
                    <div className="inline-block bg-muted/50 border border-border rounded px-2 py-1">
                      <p className="text-xs font-mono text-foreground">{car.licensePlate}</p>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditCar(car)}
                        className="flex-1 gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Car</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {car.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCar(car.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        {!isLoading && !error && cars.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3>No cars found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first vehicle to the fleet.</p>
            <Button onClick={handleAddCar} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Car
            </Button>
          </div>
        )}
      </div>

      {/* Add Car Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Car</DialogTitle>
            <DialogDescription>
              Enter the details for the new vehicle.
            </DialogDescription>
          </DialogHeader>
          
          <CarForm />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Add Car
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Car</DialogTitle>
            <DialogDescription>
              Update the details for {editingCar?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <CarForm />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}