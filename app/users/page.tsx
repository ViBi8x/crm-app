"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Edit, Trash2, Shield, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const roles = ["admin", "manager", "sales"];
const statuses = ["active", "inactive"];

const permissionModules = [
  { id: "contacts", name: "Contacts / Danh bạ" },
  { id: "pipeline", name: "Pipeline / Quy trình" },
  { id: "analytics", name: "Analytics / Phân tích" },
  { id: "users", name: "Users / Người dùng" },
  { id: "export", name: "Export / Xuất dữ liệu" },
];

// Default permission for role
const getDefaultPermissions = (role) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return {
        contacts: { view: true, edit: true, delete: true },
        pipeline: { view: true, edit: true, delete: false },
        analytics: { view: true, edit: false, delete: false },
        users: { view: true, edit: true, delete: true },
        export: { view: true, edit: true, delete: false },
      };
    case "manager":
      return {
        contacts: { view: true, edit: true, delete: false },
        pipeline: { view: true, edit: true, delete: false },
        analytics: { view: true, edit: false, delete: false },
        users: { view: true, edit: false, delete: false },
        export: { view: false, edit: false, delete: false },
      };
    default:
      return {
        contacts: { view: true, edit: true, delete: false },
        pipeline: { view: true, edit: true, delete: false },
        analytics: { view: true, edit: false, delete: false },
        users: { view: false, edit: false, delete: false },
        export: { view: false, edit: false, delete: false },
      };
  }
};

// Lấy danh sách manager để chọn khi add/edit sales
const getManagerOptions = (users) => users.filter((u) => u.role === "manager");

const UserForm = ({ formData, setFormData, users, isEdit = false }) => (
  <div className="grid gap-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Họ và tên</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
          placeholder="Enter full name..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Địa chỉ email</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
          placeholder="Enter email address..."
          required
        />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number
          <span className="block text-xs text-muted-foreground">Số điện thoại</span>
        </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Enter phone number..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Vai trò</span>
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) =>
            setFormData((f) => ({
              ...f,
              role: value,
              manager_id: value === "sales" ? f.manager_id : undefined, // reset nếu không phải sales
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    {formData.role === "sales" && (
      <div className="space-y-2">
        <Label htmlFor="manager_id">
          Quản lý trực tiếp
          <span className="block text-xs text-muted-foreground">Manager</span>
        </Label>
        <Select
          value={formData.manager_id || undefined}
          onValueChange={(value) => setFormData((f) => ({ ...f, manager_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn manager..." />
          </SelectTrigger>
          <SelectContent>
            {/* KHÔNG có dòng value=""! */}
            {getManagerOptions(users).map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name} ({manager.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}

    {!isEdit && (
      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
          <span className="block text-xs text-muted-foreground">Mật khẩu đăng nhập</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
          placeholder="Nhập mật khẩu hoặc để trống để tự sinh"
        />
      </div>
    )}
    {isEdit && (
      <div className="space-y-2">
        <Label htmlFor="password">
          Đặt lại mật khẩu mới (tuỳ chọn)
          <span className="block text-xs text-muted-foreground">Nhập nếu muốn đổi mật khẩu cho user này</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password || ""}
          onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
          placeholder="Nhập mật khẩu mới, để trống nếu không đổi"
        />
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor="status">
        Status
        <span className="block text-xs text-muted-foreground">Trạng thái</span>
      </Label>
      <Select value={formData.status} onValueChange={(value) => setFormData((f) => ({ ...f, status: value }))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default function UsersPage() {
  // ----- State -----
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "sales",
    status: "active",
    manager_id: undefined, // sửa lại
    password: "",
  });

  // 1. Load users từ Supabase (bảng profiles)
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (data) {
        setUsers(
          data.map((row) => ({
            ...row,
            id: row.id,
            name: row.full_name,
            createdAt: row.created_at
              ? new Date(row.created_at).toLocaleDateString("en-GB")
              : "",
            avatar: row.avatar_url || "/placeholder.svg",
            role: row.role,
            status: (row.status || "active").charAt(0).toUpperCase() + (row.status || "active").slice(1),
            permissions: getDefaultPermissions(row.role),
            manager_id: row.manager_id || undefined,
          }))
        );
      }
    };
    fetchUsers();
  }, []);

  // Bộ lọc
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === "All" || user.role?.toLowerCase() === selectedRole.toLowerCase();
      const matchesStatus = selectedStatus === "All" || user.status?.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Thêm user (gọi API route)
  const handleAddUser = useCallback(async () => {
    // 1. Kiểm tra trùng email/phone
    const { data: existed } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${formData.email},phone.eq.${formData.phone}`);

    if (existed && existed.length > 0) {
      toast.error("Email hoặc số điện thoại đã tồn tại, vui lòng nhập lại!");
      return;
    }

    // 2. Gửi request tạo user như cũ
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          manager_id: formData.role === "sales" ? formData.manager_id ?? null : null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Add user failed!");
        return;
      }
      setUsers((prev) => [
        ...prev,
        {
          ...formData,
          id: json.uid,
          name: formData.name,
          createdAt: new Date().toLocaleDateString("en-GB"),
          avatar: "/placeholder.svg",
          permissions: getDefaultPermissions(formData.role),
        },
      ]);
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "sales",
        status: "active",
        manager_id: undefined,
        password: "",
      });
      toast.success("Đã thêm người dùng thành công!");
    } catch (e) {
      toast.error("Add user failed!");
    }
  }, [formData]);

  // Sửa user (gọi API /api/users/update)
  const handleEditUser = useCallback(async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id;

    // 1. Kiểm tra trùng email/phone (ngoại trừ chính user này)
    const { data: existed } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${formData.email},phone.eq.${formData.phone}`)
      .neq("id", userId);

    if (existed && existed.length > 0) {
      toast.error("Email hoặc số điện thoại đã tồn tại, vui lòng nhập lại!");
      return;
    }

    // 2. Gọi API update user
    const res = await fetch("/api/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status.toLowerCase(),
        manager_id: formData.role === "sales" ? formData.manager_id ?? null : null,
        password: formData.password, // Để trống nếu không đổi
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result?.error || "Update user failed!");
      return;
    }

    // Update user in state
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role.toLowerCase(),
              status: formData.status.toLowerCase(),
              manager_id: formData.role === "sales" ? formData.manager_id ?? null : null,
              permissions: getDefaultPermissions(formData.role),
            }
          : u
      )
    );
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    toast.success("Đã cập nhật người dùng thành công!");
  }, [selectedUser, formData]);

  // Xoá user (bảng profiles)
  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    const userId = userToDelete.id;

    // Gọi API xoá (xử lý cả Auth + profiles)
    const res = await fetch("/api/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json?.error || "Delete user failed!");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
    toast.success("Đã xóa người dùng thành công!");
  }, [userToDelete]);

  const openEditDialog = useCallback((user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: formData.status.toLowerCase(),
      manager_id: user.manager_id || undefined,
      password: "",
    });
    setIsEditDialogOpen(true);
  }, []);

  const openAddDialog = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "sales",
      status: "active",
      manager_id: undefined,
      password: "",
    });
    setIsAddDialogOpen(true);
  }, []);

  // Màu badge
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "sales":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusColor = (status) => {
    return status?.toLowerCase() === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Quản lý người dùng và phân quyền</p>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters / Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users... / Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Role / Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles / Tất cả</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status / Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status / Tất cả</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Danh sách người dùng ({filteredUsers.length})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone / SĐT</TableHead>
                  <TableHead>Role / Vai trò</TableHead>
                  <TableHead>Quản lý</TableHead>
                  <TableHead>Status / Trạng thái</TableHead>
                  <TableHead className="hidden lg:table-cell">Created / Tạo lúc</TableHead>
                  <TableHead>Actions / Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {/* Nếu là sales và có manager_id, tìm user tương ứng */}
                      {user.role === "sales" && user.manager_id
                        ? (() => {
                            const manager = users.find(u => u.id === user.manager_id);
                            return manager ? manager.name : "Chưa phân bổ";
                          })()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{user.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPermissionDialogOpen(true);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14" onClick={openAddDialog}>
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User / Thêm người dùng mới</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate permissions
                <br />
                Tạo tài khoản người dùng mới với quyền hạn phù hợp
              </DialogDescription>
            </DialogHeader>
            <UserForm formData={formData} setFormData={setFormData} users={users} isEdit={false} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel / Hủy
              </Button>
              <Button onClick={handleAddUser} disabled={!formData.name || !formData.email}>
                Add User / Thêm người dùng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User / Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Update user information and settings
              <br />
              Cập nhật thông tin và cài đặt người dùng
            </DialogDescription>
          </DialogHeader>
          <UserForm formData={formData} setFormData={setFormData} users={users} isEdit={true} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel / Hủy
            </Button>
            <Button onClick={handleEditUser} disabled={!formData.name || !formData.email}>
              Save Changes / Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details / Chi tiết người dùng</DialogTitle>
            <DialogDescription>View user information and permissions</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                    <Badge className={getStatusColor(selectedUser.status)}>{selectedUser.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone / SĐT</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label>Created Date / Ngày tạo</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.createdAt}</p>
                </div>
              </div>
              <div>
                <Label>Permissions / Quyền hạn</Label>
                <div className="mt-2 space-y-2">
                  {permissionModules.map((module) => {
                    const perms = selectedUser.permissions[module.id];
                    return (
                      <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{module.name}</span>
                        <div className="flex gap-2">
                          {perms?.view && <Badge variant="outline">View</Badge>}
                          {perms?.edit && <Badge variant="outline">Edit</Badge>}
                          {perms?.delete && <Badge variant="outline">Delete</Badge>}
                          {!perms?.view && !perms?.edit && !perms?.delete && (
                            <Badge variant="secondary">No Access</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permission Management Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions / Quản lý quyền hạn</DialogTitle>
            <DialogDescription>
              Configure detailed permissions for {selectedUser?.name}
              <br />
              Cấu hình quyền hạn chi tiết cho {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {permissionModules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{module.name}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`${module.id}-view`} defaultChecked={selectedUser.permissions[module.id]?.view} />
                      <Label htmlFor={`${module.id}-view`} className="text-sm">
                        View / Xem
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`${module.id}-edit`} defaultChecked={selectedUser.permissions[module.id]?.edit} />
                      <Label htmlFor={`${module.id}-edit`} className="text-sm">
                        Edit / Sửa
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${module.id}-delete`}
                        defaultChecked={selectedUser.permissions[module.id]?.delete}
                      />
                      <Label htmlFor={`${module.id}-delete`} className="text-sm">
                        Delete / Xóa
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancel / Hủy
            </Button>
            <Button onClick={() => setIsPermissionDialogOpen(false)}>Save Changes / Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá người dùng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá người dùng{" "}
              <b>{userToDelete?.name}</b> ({userToDelete?.email}) không?
              <br />
              Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
