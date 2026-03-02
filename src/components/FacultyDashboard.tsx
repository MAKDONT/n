import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, CheckCircle, Video, XCircle, ChevronRight, Clock, ArrowLeft, LogOut } from "lucide-react";
import { apiFetch, API_BASE } from "../api";

interface Consultation {
  id: number;
  student_id: string;
  student_name: string;
  status: "waiting" | "next" | "serving";
  created_at: string;
  source: string;
  meet_link?: string;
}

interface Faculty {
  id: string;
  name: string;
  full_name?: string;
  department: string;
  status: string;
}

export default function FacultyDashboard() {
  const { id: selectedFaculty } = useParams();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [queue, setQueue] = useState<Consultation[]>([]);
  const [meetLink, setMeetLink] = useState("");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<{day: string, start: string, end: string}[]>([]);

  useEffect(() => {
    if (localStorage.getItem("user_role") !== "staff") {
      navigate("/");
      return;
    }
    fetchFaculty();
  }, [navigate]);

  useEffect(() => {
    if (selectedFaculty) {
      fetchQueue();
      // Setup WebSocket for real-time updates
      const base = API_BASE || window.location.origin;
      const wsUrl = base.replace(/^http/, "ws");
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "queue_updated") {
          fetchQueue();
        }
        if (data.type === "faculty_updated") {
          fetchFaculty();
        }
      };

      return () => ws.close();
    }
  }, [selectedFaculty]);

  const fetchFaculty = async () => {
    try {
      const res = await apiFetch("/api/faculty");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaculty(data);
      } else {
        console.error("Failed to fetch faculty: Not an array", data);
      }
    } catch (err) {
      console.error("Failed to fetch faculty", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await apiFetch(`/api/faculty/${selectedFaculty}/queue`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setQueue(data);
      } else {
        console.error("Failed to fetch queue: Not an array", data);
      }
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  const updateStatus = async (id: number, status: string, link?: string, autoCallNext: boolean = false) => {
    try {
      const res = await apiFetch(`/api/queue/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, meet_link: link }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        console.error("Failed to update status:", errData);
        alert(`Error updating status: ${errData.error}`);
        return;
      }
      
      if (autoCallNext && (status === "completed" || status === "cancelled")) {
        const alreadyNext = queue.find(s => s.status === "next" && s.id !== id);
        if (!alreadyNext) {
          const nextStudent = queue.find(s => s.status === "waiting" && s.id !== id);
          if (nextStudent) {
            await apiFetch(`/api/queue/${nextStudent.id}/status`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "next" }),
            });
          }
        }
      }
      
      fetchQueue();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleStartSession = (id: number, existingLink?: string) => {
    const finalLink = existingLink || meetLink;
    if (finalLink) {
      window.open(finalLink, '_blank');
    }
    updateStatus(id, "serving", finalLink || undefined);
    setMeetLink(""); // Clear the input after starting
  };

  const selectedFacultyData = faculty.find(f => f.id === selectedFaculty);

  const toggleFacultyStatus = async () => {
    if (!selectedFacultyData) return;
    const newStatus = selectedFacultyData.status === 'available' ? 'offline' : 'available';
    try {
      await apiFetch(`/api/faculty/${selectedFaculty}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchFaculty();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const openAvailabilityModal = () => {
    if (!selectedFacultyData) return;
    try {
      const parsed = JSON.parse(selectedFacultyData.full_name || "[]");
      if (Array.isArray(parsed)) {
        setAvailabilitySlots(parsed);
      } else {
        setAvailabilitySlots([]);
      }
    } catch (e) {
      setAvailabilitySlots([]);
    }
    setShowAvailabilityModal(true);
  };

  const saveAvailability = async () => {
    try {
      await apiFetch(`/api/faculty/${selectedFaculty}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: availabilitySlots }),
      });
      setShowAvailabilityModal(false);
      fetchFaculty();
    } catch (err) {
      console.error("Failed to save availability", err);
    }
  };

  const addSlot = () => {
    setAvailabilitySlots([...availabilitySlots, { day: "Monday", start: "09:00", end: "10:00" }]);
  };

  const removeSlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: string, value: string) => {
    const newSlots = [...availabilitySlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setAvailabilitySlots(newSlots);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Faculty Dashboard
            </h1>
          </div>
          {/* Mobile Sign Out */}
          <button
            onClick={() => {
              localStorage.removeItem("user_role");
              localStorage.removeItem("user_id");
              navigate("/");
            }}
            className="sm:hidden p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={openAvailabilityModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl transition-colors flex-1 sm:flex-none justify-center"
          >
            <Clock className="w-4 h-4" /> Availability
          </button>
          <span className="text-neutral-600 font-medium hidden sm:block">
            {selectedFacultyData ? selectedFacultyData.name : "Loading..."}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("user_role");
              localStorage.removeItem("user_id");
              navigate("/");
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Queue List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Live Queue (FIFO)</h2>
            <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-medium">
              {queue.length} Students Waiting
            </span>
          </div>

          <div className="space-y-4">
            {queue.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-neutral-500 shadow-sm border border-neutral-200">
                <Clock className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                <p className="text-xl">No students in queue.</p>
              </div>
            ) : (
              queue.map((student, index) => (
                <div
                  key={student.id}
                  className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    student.status === "serving"
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : student.status === "next"
                      ? "border-amber-500 ring-2 ring-amber-500/20"
                      : "border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-3xl sm:text-4xl font-black text-neutral-200 w-10 sm:w-12 text-center shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 truncate">
                        {student.student_name}
                      </h3>
                      <p className="text-neutral-500 font-mono text-sm sm:text-base truncate">{student.student_id}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {new Date(student.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] sm:text-xs uppercase tracking-wider">
                          {student.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    {student.status === "waiting" && (
                      <div className="flex flex-col gap-2 items-stretch sm:items-end w-full sm:w-auto">
                        {student.meet_link ? (
                          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl text-sm w-full sm:w-64 border border-indigo-100">
                            <Video className="w-4 h-4 text-indigo-500 shrink-0" />
                            <a 
                              href={student.meet_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-700 hover:underline truncate flex-1 font-medium"
                            >
                              Virtual Room Ready
                            </a>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Virtual Room Link"
                            value={meetLink}
                            onChange={(e) => setMeetLink(e.target.value)}
                            className="px-4 py-3 sm:py-2 border border-neutral-300 rounded-xl text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        )}
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => handleStartSession(student.id, student.meet_link)}
                            className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors w-full justify-center"
                          >
                            <Video className="w-4 h-4" /> Start Consultation
                          </button>
                          <button
                            onClick={() => updateStatus(student.id, "cancelled", undefined, true)}
                            className="flex items-center justify-center p-3 sm:p-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl transition-colors shrink-0"
                            title="Cancel Consultation"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {student.status === "serving" && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => updateStatus(student.id, "completed", undefined, true)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium rounded-xl transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Complete
                        </button>
                        <button
                          onClick={() => updateStatus(student.id, "cancelled", undefined, true)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-xl transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Session Controls</h3>
            {selectedFacultyData ? (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-500 mb-1">Current Status</p>
                  <p className={`text-lg font-medium flex items-center gap-2 ${
                    selectedFacultyData.status === 'available' ? 'text-emerald-600' : 
                    selectedFacultyData.status === 'busy' ? 'text-amber-600' : 'text-neutral-600'
                  }`}>
                    <span className={`w-3 h-3 rounded-full ${
                      selectedFacultyData.status === 'available' ? 'bg-emerald-500 animate-pulse' : 
                      selectedFacultyData.status === 'busy' ? 'bg-amber-500' : 'bg-neutral-500'
                    }`} />
                    {selectedFacultyData.status === 'available' ? 'Accepting Consultations' : 
                     selectedFacultyData.status === 'busy' ? 'Busy' : 'Offline'}
                  </p>
                </div>
                <button 
                  onClick={toggleFacultyStatus}
                  className="w-full py-3 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-xl transition-colors"
                >
                  {selectedFacultyData.status === 'available' ? 'Go Offline' : 'Go Available'}
                </button>
              </div>
            ) : (
              <p className="text-neutral-500">Select a faculty member.</p>
            )}
          </div>
        </div>
      </main>

      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Consultation Hours</h2>
              <button onClick={() => setShowAvailabilityModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {availabilitySlots.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No time slots set. Add your available hours below.</p>
              ) : (
                availabilitySlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-4 bg-neutral-50 p-4 rounded-xl">
                    <select
                      value={slot.day}
                      onChange={(e) => updateSlot(index, "day", e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateSlot(index, "start", e.target.value)}
                      className="px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-neutral-400">to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(index, "end", e.target.value)}
                      className="px-4 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={() => removeSlot(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-between items-center pt-6 border-t border-neutral-100">
              <button
                onClick={addSlot}
                className="px-6 py-3 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
              >
                + Add Time Slot
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="px-6 py-3 text-neutral-600 font-medium hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAvailability}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
