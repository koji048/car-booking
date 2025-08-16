import { useState } from 'react';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { MapPin, Search, Navigation, Building2 } from 'lucide-react';

interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

interface LocationPickerProps {
  destination: Location | null;
  onDestinationChange: (location: Location | null) => void;
  isRoundTrip?: boolean;
}

// Mock popular locations in Bangkok for demo
const POPULAR_LOCATIONS = [
  {
    address: 'Suvarnabhumi Airport (BKK), Bang Phli District, Samut Prakan',
    coordinates: { lat: 13.6900, lng: 100.7501 },
    placeId: 'ChIJX7w9eKSe4jARUmH4YbLzM1E'
  },
  {
    address: 'Don Mueang International Airport (DMK), Don Mueang, Bangkok',
    coordinates: { lat: 13.9126, lng: 100.6065 },
    placeId: 'ChIJDw7_PwOZ4jARc5WBBFq1eZE'
  },
  {
    address: 'Chatuchak Weekend Market, Chatuchak, Bangkok',
    coordinates: { lat: 13.7997, lng: 100.5495 },
    placeId: 'ChIJIUlKgr2X4jARGGI5I8xOSkg'
  },
  {
    address: 'Siam Paragon, Pathum Wan, Bangkok',
    coordinates: { lat: 13.7460, lng: 100.5349 },
    placeId: 'ChIJ5cqQgq-Y4jARG3nQ2bK05_c'
  },
  {
    address: 'Central World, Pathum Wan, Bangkok',
    coordinates: { lat: 13.7472, lng: 100.5400 },
    placeId: 'ChIJr7ZnRrGY4jARxKjhSCrlPx0'
  },
  {
    address: 'Bangkok Railway Station (Hua Lamphong), Pathum Wan, Bangkok',
    coordinates: { lat: 13.7370, lng: 100.5170 },
    placeId: 'ChIJPQKOgKmY4jAR8eQOFOWkkic'
  },
  {
    address: 'Khao San Road, Phra Nakhon, Bangkok',
    coordinates: { lat: 13.7590, lng: 100.4970 },
    placeId: 'ChIJy2EWE3qZ4jARAZfF1wVOLGU'
  },
  {
    address: 'Icon Siam, Khlong San, Bangkok',
    coordinates: { lat: 13.7269, lng: 100.5104 },
    placeId: 'ChIJQzxnwHWZ4jARjh-mEzaGX1E'
  }
];

export function LocationPicker({ 
  destination, 
  onDestinationChange
}: LocationPickerProps) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pickupSearch, setPickupSearch] = useState('');
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(destination);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(destination);

  const filterLocations = (search: string) => {
    if (!search.trim()) return POPULAR_LOCATIONS;
    return POPULAR_LOCATIONS.filter(location =>
      location.address.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleSelect = (location: Location) => {
    onDestinationChange(location);
    setSearch(location.address);
    setShowSuggestions(false);
  };

  const handlePickupSelect = (location: Location) => {
    setPickupLocation(location);
    setPickupSearch(location.address);
    setShowPickupSuggestions(false);
  };

  const handleDropoffSelect = (location: Location) => {
    setDropoffLocation(location);
    setDropoffSearch(location.address);
    setShowDropoffSuggestions(false);
  };

  const getCurrentLocation = () => {
    // Mock current location in Bangkok
    const currentLocation: Location = {
      address: 'Current Location - Silom Road, Bang Rak, Bangkok',
      coordinates: { lat: 13.7308, lng: 100.5418 }
    };
    return currentLocation;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Destination Location */}
        <div className="space-y-2">
          <Label htmlFor="destination">Destination *</Label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="destination"
                placeholder="Search for destination..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 px-2"
                onClick={() => {
                  const current = getCurrentLocation();
                  handleSelect(current);
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
            
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Popular Destinations</p>
                  {filterLocations(search).map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => handleSelect(location)}
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{location.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {destination && (
            <div className="p-3 bg-accent/50 border border-border rounded-md">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{destination.address}</p>
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {destination.coordinates.lat.toFixed(4)}, {destination.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Placeholder */}
        <div className="h-48 bg-muted/50 border border-border rounded-md flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Interactive Map</p>
            <p className="text-xs text-muted-foreground">
              {destination ? 'Showing selected destination' : 'Select a destination to view on map'}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>Note:</strong> For internal company use, pickup will be from the office. 
          Please select your destination location for navigation and trip planning.
        </div>
      </CardContent>
    </Card>
  );
}