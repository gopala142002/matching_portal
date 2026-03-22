import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown, Plus } from "lucide-react";
import api from "./api";
import collegesData from "../data/colleges.json";
import researchDomainsData from "../data/researchDomains.json";

const ACADEMIC_POSITIONS = [
  "Student",
  "Research Scholar",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Postdoctoral Researcher",
  "Industry Researcher",
  "Other",
];

function formatDomainLabel(domain) {
  return domain.replaceAll("_", " ");
}

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [institution, setInstitution] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);

  const [department, setDepartment] = useState("");
  const [academic_position, setAcademic_position] = useState("");

  const [researchDomain, setResearchDomain] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const institutionRef = useRef(null);
  const topicRef = useRef(null);

  const collegeOptions = useMemo(() => {
    const institutes = collegesData?.institutes || [];
    return [...institutes].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const researchDomainMap = researchDomainsData?.cs_domains || {};

  const researchDomains = useMemo(() => {
    return Object.keys(researchDomainMap);
  }, [researchDomainMap]);

  const allTopics = useMemo(() => {
    return [...new Set(Object.values(researchDomainMap).flat())].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [researchDomainMap]);

  const filteredColleges = useMemo(() => {
    const query = institutionSearch.trim().toLowerCase();

    if (!query) return collegeOptions;

    return collegeOptions.filter(
      (college) =>
        college.name.toLowerCase().includes(query) ||
        college.country.toLowerCase().includes(query)
    );
  }, [institutionSearch, collegeOptions]);

  const filteredTopics = useMemo(() => {
    const query = topicSearch.trim().toLowerCase();

    return allTopics.filter(
      (topic) =>
        topic.toLowerCase().includes(query) && !selectedTopics.includes(topic)
    );
  }, [topicSearch, allTopics, selectedTopics]);

  const passwordsMatch =
    password.length === 0 || confirmPassword.length === 0
      ? true
      : password === confirmPassword;

  const canSubmit =
    passwordsMatch &&
    institution.trim().length > 0 &&
    academic_position.trim().length > 0 &&
    researchDomain.trim().length > 0;

  function addTopic(value) {
    const cleaned = value.trim();
    if (!cleaned || selectedTopics.includes(cleaned)) return;
    setSelectedTopics((prev) => [...prev, cleaned]);
  }

  function removeTopic(value) {
    setSelectedTopics((prev) => prev.filter((topic) => topic !== value));
  }

  function handleCollegeSelect(college) {
    setInstitution(college.name);
    setInstitutionSearch(`${college.name} (${college.country})`);
    setShowInstitutionDropdown(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const payload = {
        name,
        email,
        password,
        institution,
        department,
        academic_position,
        research_domain: researchDomain,
        research_interests: selectedTopics,
      };

      const res = await api.post("/api/auth/register/", payload);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/author/dashboard");
    } catch (err) {
      console.error("Registration error:", err.response?.data || err);
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (institutionRef.current && !institutionRef.current.contains(e.target)) {
        setShowInstitutionDropdown(false);
      }
      if (topicRef.current && !topicRef.current.contains(e.target)) {
        setShowTopicDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl rounded-3xl border bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border px-3 py-2 pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full rounded-xl border px-3 py-2 pr-11 ${!passwordsMatch ? "border-red-500" : ""
                  }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <div ref={institutionRef}>
            <label className="text-sm font-medium text-gray-700">Institution</label>
            <div className="relative mt-1">
              <input
                type="text"
                className="w-full rounded-xl border px-3 py-2 pr-10"
                placeholder="Search and select your college"
                value={institutionSearch}
                onChange={(e) => {
                  setInstitutionSearch(e.target.value);
                  setInstitution("");
                  setShowInstitutionDropdown(true);
                }}
                onFocus={() => setShowInstitutionDropdown(true)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                onClick={() => setShowInstitutionDropdown((prev) => !prev)}
              >
                <ChevronDown size={18} />
              </button>

              {showInstitutionDropdown && (
                <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                  {filteredColleges.length > 0 ? (
                    filteredColleges.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        className="block w-full border-b px-4 py-2 text-left hover:bg-gray-100"
                        onClick={() => handleCollegeSelect(college)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {college.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {college.country}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No matching college found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Department</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Academic Position
            </label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
              value={academic_position}
              onChange={(e) => setAcademic_position(e.target.value)}
              required
            >
              <option value="">Select academic position</option>
              {ACADEMIC_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Research Domain
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-400 focus:outline-none focus:ring-0"
              value={researchDomain}
              onChange={(e) => setResearchDomain(e.target.value)}
              required
            >
              <option value="">Select research domain</option>
              {researchDomains.map((domain) => (
                <option key={domain} value={domain}>
                  {formatDomainLabel(domain)}
                </option>
              ))}
            </select>
          </div>

          <div ref={topicRef}>
            <label className="text-sm font-medium text-gray-700">Topics</label>

            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <span
                  key={topic}
                  className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    className="text-gray-700 hover:text-black"
                    onClick={() => removeTopic(topic)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="relative mt-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={() => setShowTopicDropdown((prev) => !prev)}
              >
                <Plus size={16} />
                Add Topic
              </button>

              {showTopicDropdown && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow-lg">
                  <input
                    className="w-full border-b px-3 py-2 outline-none"
                    placeholder="Search and select a topic"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="max-h-60 overflow-y-auto">
                    {filteredTopics.length > 0 ? (
                      filteredTopics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          onClick={() => {
                            addTopic(topic);
                            setTopicSearch("");
                            setShowTopicDropdown(false);
                          }}
                        >
                          {topic}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No matching topic found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            disabled={!canSubmit}
            className="w-full rounded-xl bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link className="font-medium text-gray-900" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}