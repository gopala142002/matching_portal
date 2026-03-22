import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  BookOpen,
  GraduationCap,
  Mail,
  Plus,
  User,
  X,
} from "lucide-react";
import collegesData from "../../data/colleges.json";
import researchDomainsData from "../../data/researchDomains.json";

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

export default function EditProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    institution: "",
    department: "",
    academic_position: "",
    research_domain: "",
  });

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const institutionRef = useRef(null);
  const topicRef = useRef(null);

  const collegeOptions = useMemo(() => {
    const colleges = Array.isArray(collegesData)
      ? collegesData
      : Array.isArray(collegesData?.institutes)
      ? collegesData.institutes
      : [];

    return [...colleges].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, []);

  const domainOptions = useMemo(() => {
    const domainSource = researchDomainsData?.cs_domains || {};

    return Object.entries(domainSource).map(([key, topics]) => ({
      key,
      label: key.replace(/_/g, " "),
      topics: Array.isArray(topics) ? topics : [],
    }));
  }, []);

  const allTopics = useMemo(() => {
    const topicsSet = new Set();

    domainOptions.forEach((domain) => {
      domain.topics.forEach((topic) => {
        if (typeof topic === "string" && topic.trim()) {
          topicsSet.add(topic.trim());
        }
      });
    });

    return Array.from(topicsSet).sort((a, b) => a.localeCompare(b));
  }, [domainOptions]);

  const filteredColleges = useMemo(() => {
    const query = institutionSearch.trim().toLowerCase();

    if (!query) return collegeOptions;

    return collegeOptions.filter((college) => {
      const name = (college.name || "").toLowerCase();
      const country = (college.country || "").toLowerCase();
      return name.includes(query) || country.includes(query);
    });
  }, [collegeOptions, institutionSearch]);

  const filteredTopics = useMemo(() => {
    const query = topicSearch.trim().toLowerCase();

    return allTopics.filter((topic) => {
      const matches = topic.toLowerCase().includes(query);
      const notSelected = !selectedTopics.includes(topic);
      return matches && notSelected;
    });
  }, [allTopics, topicSearch, selectedTopics]);

  useEffect(() => {
    const mockProfile = {
      name: "John Doe",
      email: "john@example.com",
      institution: "IIT Delhi",
      department: "Computer Science",
      academic_position: "Research Scholar",
      research_domain: "Algorithms_and_Data_Structures",
      topics: ["machine learning", "database", "optimization"],
    };

    setProfile({
      name: mockProfile.name,
      email: mockProfile.email,
      institution: mockProfile.institution,
      department: mockProfile.department,
      academic_position: mockProfile.academic_position,
      research_domain: mockProfile.research_domain,
    });

    setInstitutionSearch(mockProfile.institution || "");
    setSelectedTopics(mockProfile.topics || []);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        institutionRef.current &&
        !institutionRef.current.contains(event.target)
      ) {
        setShowInstitutionDropdown(false);
      }

      if (topicRef.current && !topicRef.current.contains(event.target)) {
        setShowTopicDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleInstitutionSelect(college) {
    const selectedName = college.name || "";

    setProfile((prev) => ({
      ...prev,
      institution: selectedName,
    }));
    setInstitutionSearch(selectedName);
    setShowInstitutionDropdown(false);
  }

  function addTopic(topic) {
    if (!topic || selectedTopics.includes(topic)) return;
    setSelectedTopics((prev) => [...prev, topic]);
    setTopicSearch("");
    setShowTopicDropdown(false);
  }

  function removeTopic(topic) {
    setSelectedTopics((prev) => prev.filter((item) => item !== topic));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const updatedProfile = {
      ...profile,
      topics: selectedTopics,
    };

    console.log("Updated Profile:", updatedProfile);
    alert("Profile updated successfully");
    navigate(-1);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-visible rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-6 md:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                <User size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  Edit Profile
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Keep your academic and research details up to date.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-2 md:px-8"
          >
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User size={16} />
                Full Name
              </label>
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-500"
                required
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail size={16} />
                Email
              </label>
              <input
                value={profile.email}
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
              />
            </div>

            <div
              ref={institutionRef}
              className="relative rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
            >
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 size={16} />
                Institution
              </label>

              <input
                type="text"
                value={institutionSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setInstitutionSearch(value);
                  setProfile((prev) => ({
                    ...prev,
                    institution: value,
                  }));
                  setShowInstitutionDropdown(true);
                }}
                onFocus={() => setShowInstitutionDropdown(true)}
                placeholder="Search and select your college"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-500"
                required
              />

              {showInstitutionDropdown && (
                <div className="absolute left-4 right-4 top-[calc(100%-2px)] z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-64 overflow-y-auto">
                    {filteredColleges.length > 0 ? (
                      filteredColleges.map((college, index) => (
                        <button
                          key={`${college.name}-${index}`}
                          type="button"
                          onClick={() => handleInstitutionSelect(college)}
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {college.name}
                          </div>
                          {college.country && (
                            <div className="text-xs text-gray-500">
                              {college.country}
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No college found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <BookOpen size={16} />
                Department
              </label>
              <input
                name="department"
                value={profile.department}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-500"
                required
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <GraduationCap size={16} />
                Academic Position
              </label>
              <select
                name="academic_position"
                value={profile.academic_position}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-500"
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

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <BookOpen size={16} />
                Research Domain
              </label>
              <select
                name="research_domain"
                value={profile.research_domain}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-gray-500"
                required
              >
                <option value="">Select research domain</option>
                {domainOptions.map((domain) => (
                  <option key={domain.key} value={domain.key}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              ref={topicRef}
              className="relative overflow-visible md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
            >
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <BookOpen size={16} />
                Topics
              </label>

              {selectedTopics.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-800"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
                        className="text-gray-500 transition hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopicDropdown((prev) => !prev);
                    setTopicSearch("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                >
                  <Plus size={16} />
                  Add Topic
                </button>

                {showTopicDropdown && (
                  <div className="absolute left-0 top-full z-20 mt-3 w-[380px] max-w-[calc(100vw-4rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 p-3">
                      <input
                        type="text"
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="Search and select a topic"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {filteredTopics.length > 0 ? (
                        filteredTopics.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => addTopic(topic)}
                            className="block w-full px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-50"
                          >
                            {topic}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No topic found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end md:col-span-2">
              <button className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}