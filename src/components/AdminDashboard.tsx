import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, Plus, Building, UserPlus, ArrowLeft } from "lucide-react";
import { apiFetch } from "../api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  // College form
  const [collegeName, setCollegeName] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [addingCollege, setAddingCollege] = useState(false);
  const [collegeError, setCollegeError] = useState("");
  
  // Department form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [addingDept, setAddingDept] = useState(false);
  const [deptError, setDeptError] = useState("");
  
  // Faculty form
  const [facName, setFacName] = useState("");
  const [facDept, setFacDept] = useState("");
  const [facEmail, setFacEmail] = useState("");
  const [facPassword, setFacPassword] = useState("");
  const [addingFac, setAddingFac] = useState(false);
  const [facError, setFacError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("user_role") !== "admin") {
      navigate("/");
      return;
    }
    fetchDepartments();
    fetchColleges();
    fetchFaculties();
  }, [navigate]);

  const fetchFaculties = async () => {
    try {
      const res = await apiFetch("/api/faculty");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaculties(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await apiFetch("/api/colleges");
      const data = await res.json();
      if (Array.isArray(data)) {
        setColleges(data);
        if (data.length > 0) {
          setCollegeId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiFetch("/api/departments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollegeError("");

    if (!collegeName.trim()) {
      setCollegeError("College name is required.");
      return;
    }
    if (!collegeCode.trim()) {
      setCollegeError("College code is required.");
      return;
    }

    setAddingCollege(true);
    try {
      const res = await apiFetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: collegeName.trim(), code: collegeCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add college");
      setCollegeName("");
      setCollegeCode("");
      fetchColleges();
      alert("College added successfully");
    } catch (err: any) {
      console.error(err);
      setCollegeError(err.message);
    } finally {
      setAddingCollege(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError("");

    if (!deptName.trim()) {
      setDeptError("Department name is required.");
      return;
    }
    if (!deptCode.trim()) {
      setDeptError("Department code is required.");
      return;
    }
    if (!collegeId) {
      setDeptError("College selection is required.");
      return;
    }

    setAddingDept(true);
    try {
      const res = await apiFetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim(), code: deptCode.trim(), college_id: collegeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add department");
      setDeptName("");
      setDeptCode("");
      fetchDepartments();
      alert("Department added successfully");
    } catch (err: any) {
      console.error(err);
      setDeptError(err.message);
    } finally {
      setAddingDept(false);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacError("");

    if (!facName.trim()) {
      setFacError("Faculty name is required.");
      return;
    }
    if (!facDept) {
      setFacError("Department selection is required.");
      return;
    }
    if (!facEmail.trim()) {
      setFacError("Email is required.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facEmail.trim())) {
      setFacError("Please enter a valid email address.");
      return;
    }

    if (!facPassword.trim()) {
      setFacError("Password is required.");
      return;
    }
    if (facPassword.trim().length < 6) {
      setFacError("Password must be at least 6 characters long.");
      return;
    }

    setAddingFac(true);
    try {
      const id = crypto.randomUUID();
      const res = await apiFetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: facName.trim(),
          department_id: facDept,
          email: facEmail.trim(),
          password: facPassword.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add faculty");
      setFacName("");
      setFacDept("");
      setFacEmail("");
      setFacPassword("");
      fetchFaculties();
      alert("Faculty added successfully");
    } catch (err: any) {
      console.error(err);
      setFacError(err.message);
    } finally {
      setAddingFac(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <header className="bg-white shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-neutral-600" />
          </button>
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              const res = await apiFetch('/api/test/make-all-available');
              const data = await res.json();
              alert('Updated: ' + JSON.stringify(data));
              fetchFaculties();
            }}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Make All Faculty Available (Test)
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add College */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-2xl">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Add College</h2>
          </div>

          <form onSubmit={handleAddCollege} className="space-y-4">
            {collegeError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {collegeError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                College Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. College of Engineering"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-purple-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                College Code
              </label>
              <input
                type="text"
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value)}
                placeholder="e.g. COE"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-purple-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={addingCollege || !collegeName || !collegeCode}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              {addingCollege ? "Adding..." : "Add College"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Existing Colleges</h3>
            <ul className="space-y-2">
              {colleges.length === 0 ? (
                <li className="text-neutral-400 text-sm">No colleges found.</li>
              ) : (
                colleges.map((c: any) => (
                  <li key={c.id} className="p-3 bg-neutral-50 rounded-xl text-neutral-700 font-medium">
                    {c.name} ({c.code})
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Add Department */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Add Department</h2>
          </div>

          <form onSubmit={handleAddDepartment} className="space-y-4">
            {deptError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {deptError}
              </div>
            )}
            {colleges.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 block">
                  Select College
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                  required
                >
                  <option value="" disabled>Select College</option>
                  {colleges.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 block">
                  College ID (Required)
                </label>
                <input
                  type="text"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Department Name
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Computer Engineering"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Department Code
              </label>
              <input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="e.g. BSCpE"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={addingDept || !deptName || !deptCode}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              {addingDept ? "Adding..." : "Add Department"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Existing Departments</h3>
            <ul className="space-y-2">
              {departments.length === 0 ? (
                <li className="text-neutral-400 text-sm">No departments found.</li>
              ) : (
                departments.map((d: any) => (
                  <li key={d.id} className="p-3 bg-neutral-50 rounded-xl text-neutral-700 font-medium">
                    {d.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Add Faculty */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6 self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <UserPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Add Faculty Member</h2>
          </div>

          <form onSubmit={handleAddFaculty} className="space-y-4">
            {facError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {facError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Full Name
              </label>
              <input
                type="text"
                value={facName}
                onChange={(e) => setFacName(e.target.value)}
                placeholder="e.g. Dr. Alan Turing"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Department
              </label>
              <select
                value={facDept}
                onChange={(e) => setFacDept(e.target.value)}
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                required
              >
                <option value="" disabled>Select Department</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Email Address
              </label>
              <input
                type="email"
                value={facEmail}
                onChange={(e) => setFacEmail(e.target.value)}
                placeholder="e.g. aturing@earist.edu.ph"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 block">
                Password
              </label>
              <input
                type="password"
                value={facPassword}
                onChange={(e) => setFacPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-4 border-2 border-neutral-200 rounded-2xl bg-neutral-50 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={addingFac || !facName || !facDept || !facEmail || !facPassword}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              {addingFac ? "Adding..." : "Add Faculty"}
            </button>
          </form>
        </div>
      </main>

      {/* Registered Faculties Table */}
      <section className="px-8 pb-12 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Registered Faculties</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-100">
                  <th className="py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-sm">Name</th>
                  <th className="py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-sm">Email</th>
                  <th className="py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-sm">Faculty Code</th>
                  <th className="py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-sm">Department</th>
                  <th className="py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {faculties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No faculties registered yet.
                    </td>
                  </tr>
                ) : (
                  faculties.map((fac) => (
                    <tr key={fac.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-neutral-900">{fac.name}</td>
                      <td className="py-4 px-4 text-neutral-600">{fac.email}</td>
                      <td className="py-4 px-4 font-mono text-sm text-neutral-500">{fac.faculty_code}</td>
                      <td className="py-4 px-4 text-neutral-600">
                        {fac.department || "Unknown"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fac.status === 'available' ? 'bg-green-100 text-green-800' :
                          fac.status === 'busy' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {fac.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
