# Quick Guide: Creating App Roles in Azure AD

## 📋 Steps to Create App Roles

### 1️⃣ Open Azure Portal
- Go to https://portal.azure.com
- Navigate to: **Azure Active Directory** → **App registrations**
- Select: **Carbooking-SGS** (your app)

### 2️⃣ Create App Roles
- Click: **App roles** (in left menu)
- Click: **Create app role**

Create these 4 roles:

#### Role 1: Administrator
```
Display name: Administrator
Value: Admin
Description: Full system access
Allowed member types: Users/Groups
✅ Enable this app role
```

#### Role 2: HR Staff
```
Display name: HR Staff  
Value: HR
Description: HR approval access
Allowed member types: Users/Groups
✅ Enable this app role
```

#### Role 3: Manager
```
Display name: Manager
Value: Manager
Description: Team approval access
Allowed member types: Users/Groups
✅ Enable this app role
```

#### Role 4: Employee
```
Display name: Employee
Value: Employee
Description: Booking creation access
Allowed member types: Users/Groups
✅ Enable this app role
```

### 3️⃣ Assign Roles to Users

#### Go to Enterprise Applications:
1. **Azure AD** → **Enterprise applications**
2. Find: **Carbooking-SGS**
3. Click: **Users and groups**

#### Add Role Assignment:
1. Click: **+ Add user/group**
2. **Users**: Select user(s)
3. **Select a role**: Choose role (Admin/HR/Manager/Employee)
4. Click: **Assign**

### 4️⃣ Test the Roles

1. **Logout** from the car booking app
2. **Login** again with OAuth
3. Check browser console (F12):
   ```
   App roles from token: ["Admin"]
   Role determined from app roles
   User assigned role: Admin
   ```

## 🎯 Benefits Over Groups

✅ **Faster** - No extra API calls needed  
✅ **Secure** - Roles are app-specific  
✅ **Simple** - Easy to manage in Azure  
✅ **Efficient** - Smaller token size  

## 🔧 Troubleshooting

### Roles not showing?
- User needs to logout and login again
- Check role assignment in Enterprise Applications
- Verify app role is enabled

### Need to assign to many users?
1. Create groups: `CarBooking-Admins`, `CarBooking-HR`, etc.
2. Assign app role to the GROUP
3. Add users to the group

## 📝 Current Implementation

The app now supports BOTH methods:
1. **App Roles** (preferred) - Checked first
2. **Groups** (fallback) - Used if no app roles

Once you set up app roles, they'll be used automatically!