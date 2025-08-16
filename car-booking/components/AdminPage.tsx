import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Car, User, Plus, Edit3, Trash2, Settings, Save, X, Upload, Link, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GSLogoSmall } from './GSLogo';

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
  image: string;
  status: 'available' | 'in-use' | 'maintenance';
}

interface AdminPageProps {
  user: User;
  onLogout: () => void;
}

// Mock initial car data
const INITIAL_CARS: CarData[] = [
  {
    id: '1',
    name: 'Toyota Camry',
    type: 'Sedan',
    seats: 5,
    licensePlate: 'กข 1234 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
    status: 'available'
  },
  {
    id: '2',
    name: 'Honda CR-V',
    type: 'SUV',
    seats: 7,
    licensePlate: 'คง 5678 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
    status: 'available'
  },
  {
    id: '3',
    name: 'Ford Focus',
    type: 'Compact',
    seats: 5,
    licensePlate: 'จฉ 9012 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop',
    status: 'in-use'
  },
  {
    id: '4',
    name: 'Chevrolet Suburban',
    type: 'Large SUV',
    seats: 8,
    licensePlate: 'ชซ 3456 กรุงเทพมหานคร',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop',
    status: 'maintenance'
  }
];

const CAR_TYPES = ['Sedan', 'SUV', 'Compact', 'Large SUV', 'Van', 'Pickup Truck'];
const SEAT_OPTIONS = [2, 4, 5, 7, 8, 9, 12, 15];
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'in-use', label: 'In Use', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-red-100 text-red-800' }
];

export function AdminPage({ user, onLogout }: AdminPageProps) {
  const [cars, setCars] = useState<CarData[]>(INITIAL_CARS);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CarData>>({
    name: '',
    type: '',
    seats: 5,
    licensePlate: '',
    image: '',
    status: 'available'
  });

  const handleAddCar = () => {
    setFormData({
      name: '',
      type: '',
      seats: 5,
      licensePlate: '',
      image: '',
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

  const handleDeleteCar = (carId: string) => {
    setCars(prev => prev.filter(car => car.id !== carId));
  };

  const handleSave = () => {
    if (!formData.name || !formData.type || !formData.licensePlate) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingCar) {
      // Update existing car
      setCars(prev => prev.map(car => 
        car.id === editingCar.id 
          ? { ...car, ...formData } as CarData
          : car
      ));
      setIsEditDialogOpen(false);
    } else {
      // Add new car
      const newCar: CarData = {
        id: Date.now().toString(),
        ...formData as CarData
      };
      setCars(prev => [...prev, newCar]);
      setIsAddDialogOpen(false);
    }
    
    setEditingCar(null);
    setFormData({
      name: '',
      type: '',
      seats: 5,
      licensePlate: '',
      image: '',
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
      image: '',
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
          setFormData(prev => ({ ...prev, image: result }));
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
    if (editingCar?.image && !editingCar.image.startsWith('data:')) {
      setFormData(prev => ({ ...prev, image: editingCar.image }));
    } else {
      setFormData(prev => ({ ...prev, image: '' }));
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
              value={formData.image?.startsWith('data:') ? '' : formData.image || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, image: e.target.value }));
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

      {formData.image && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="aspect-video w-32 overflow-hidden rounded-md border">
            <ImageWithFallback
              src={formData.image}
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
            <GSLogoSmall size={30} />
            <div className="h-6 w-px bg-border" />
            <Settings className="h-6 w-6" />
            <h1>GS Battery Admin Panel</h1>
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
                  <p className="text-xl font-medium">{cars.filter(c => c.status === 'in-use').length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
            const statusConfig = getStatusBadge(car.status);
            
            return (
              <Card key={car.id}>
                <CardContent className="p-4">
                  <div className="aspect-video mb-3 overflow-hidden rounded-md">
                    <ImageWithFallback
                      src={car.image}
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

        {cars.length === 0 && (
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