import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import axios from "axios";
import { ChevronDown, Plus } from "lucide-react";
import collegesData from "../../data/colleges.json";
import researchDomainsData from "../../data/researchDomains.json";

function formatDomainLabel(domain) {
  return domain.replaceAll("_", " ");
}

export default function SubmitPaper() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [research_domain, setResearchDomain] = useState(""); // ✅ FIXED
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("");

  const [authors, setAuthors] = useState([{ name: "", institute: "" }]);

  const [instituteSearches, setInstituteSearches] = useState([""]);
  const [openInstituteIndex, setOpenInstituteIndex] = useState(null);

  const [topicSearch, setTopicSearch] = useState("");
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const instituteRefs = useRef([]);
  const topicRef = useRef(null);

  const collegeOptions = useMemo(() => {
    const institutes = collegesData?.institutes || [];
    return [...institutes].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const researchDomainMap = researchDomainsData?.cs_domains || {};

  const subjectAreaOptions = useMemo(() => {
    return Object.keys(researchDomainMap);
  }, [researchDomainMap]);

  const allTopics = useMemo(() => {
    return [...new Set(Object.values(researchDomainMap).flat())].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [researchDomainMap]);

  const filteredTopics = useMemo(() => {
    const query = topicSearch.trim().toLowerCase();

    return allTopics.filter(
      (topic) =>
        topic.toLowerCase().includes(query) && !keywords.includes(topic)
    );
  }, [topicSearch, allTopics, keywords]);

  function getFilteredColleges(searchValue) {
    const query = searchValue.trim().toLowerCase();
    if (!query) return collegeOptions;

    return collegeOptions.filter(
      (college) =>
        college.name.toLowerCase().includes(query) ||
        college.country.toLowerCase().includes(query)
    );
  }

  function handleAuthorChange(index, field, value) {
    const updated = [...authors];
    updated[index][field] = value;
    setAuthors(updated);
  }

  function handleInstituteSearchChange(index, value) {
    const updatedSearches = [...instituteSearches];
    updatedSearches[index] = value;
    setInstituteSearches(updatedSearches);

    const updatedAuthors = [...authors];
    updatedAuthors[index].institute = "";
    setAuthors(updatedAuthors);

    setOpenInstituteIndex(index);
  }

  function handleInstituteSelect(index, college) {
    const updatedAuthors = [...authors];
    updatedAuthors[index].institute = college.name;
    setAuthors(updatedAuthors);

    const updatedSearches = [...instituteSearches];
    updatedSearches[index] = `${college.name} (${college.country})`;
    setInstituteSearches(updatedSearches);

    setOpenInstituteIndex(null);
  }

  function addAuthor() {
    setAuthors([...authors, { name: "", institute: "" }]);
    setInstituteSearches([...instituteSearches, ""]);
  }

  function removeAuthor(index) {
    setAuthors(authors.filter((_, i) => i !== index));
    setInstituteSearches(instituteSearches.filter((_, i) => i !== index));
    if (openInstituteIndex === index) setOpenInstituteIndex(null);
  }

  function addKeyword(value) {
    const cleaned = value.trim();
    if (!cleaned || keywords.includes(cleaned)) return;
    setKeywords((prev) => [...prev, cleaned]);
  }

  function removeKeyword(value) {
    setKeywords((prev) => prev.filter((item) => item !== value));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (!pdf) {
        alert("Please select a PDF first.");
        return;
      }

      for (const a of authors) {
        if (!a.name || !a.institute) {
          alert("Please fill name and institute for all authors.");
          return;
        }
      }

      // 🔐 Get upload auth
      const authRes = await api.get("/api/files/upload_auth/");
      const { token, signature, expire, publicKey } = authRes.data;

      // 📤 Upload PDF
      const formData = new FormData();
      formData.append("file", pdf);
      formData.append("fileName", pdf.name);
      formData.append("token", token);
      formData.append("signature", signature);
      formData.append("expire", expire);
      formData.append("publicKey", publicKey);
      formData.append("folder", "/Research_Papers");

      const uploadRes = await axios.post(
        "https://upload.imagekit.io/api/v1/files/upload",
        formData
      );

      const pdf_url = uploadRes.data.url;

      // 📄 Submit paper (FIXED)
      await api.post("/api/papers/create/", {
        title,
        abstract,
        keywords,
        research_domain: [research_domain], // ✅ IMPORTANT FIX
        pdf_url,
        authors,
      });

      setMsg("✅ Paper submitted successfully!");

      // 🔄 Reset
      setTitle("");
      setAbstract("");
      setKeywords([]);
      setResearchDomain("");
      setPdf(null);
      setAuthors([{ name: "", institute: "" }]);
      setInstituteSearches([""]);
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      alert("Upload failed. Check console.");
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        openInstituteIndex !== null &&
        instituteRefs.current[openInstituteIndex] &&
        !instituteRefs.current[openInstituteIndex].contains(e.target)
      ) {
        setOpenInstituteIndex(null);
      }

      if (topicRef.current && !topicRef.current.contains(e.target)) {
        setShowTopicDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openInstituteIndex]);

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Submit Paper</h2>

      {msg && (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* Title */}
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Abstract */}
        <textarea
          className="w-full rounded-xl border px-3 py-2"
          rows={4}
          placeholder="Abstract"
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          required
        />

        {/* Authors */}
        {authors.map((author, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2"
              placeholder="Author Name"
              value={author.name}
              onChange={(e) =>
                handleAuthorChange(index, "name", e.target.value)
              }
              required
            />

            <input
              className="flex-1 rounded-xl border px-3 py-2"
              placeholder="Institute"
              value={author.institute}
              onChange={(e) =>
                handleAuthorChange(index, "institute", e.target.value)
              }
              required
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAuthor}
          className="rounded-xl border px-4 py-2 text-sm"
        >
          + Add Author
        </button>

        {/* Keywords */}
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Keywords (comma separated)"
          onBlur={(e) => setKeywords(e.target.value.split(","))}
        />

        {/* Subject Area */}
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={research_domain}
          onChange={(e) => setResearchDomain(e.target.value)}
          required
        >
          <option value="">Select subject area</option>
          {subjectAreaOptions.map((d) => (
            <option key={d} value={d}>
              {formatDomainLabel(d)}
            </option>
          ))}
        </select>

        {/* PDF */}
        <div className="w-full">
  <input
    id="pdfUpload"
    type="file"
    accept="application/pdf"
    onChange={(e) => setPdf(e.target.files?.[0] || null)}
    className="hidden"
  />

  <label
    htmlFor="pdfUpload"
    className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 transition"
  >
    <span className="text-sm text-gray-500">
      📄 Upload your paper (PDF)
    </span>

    <span className="mt-2 text-xs text-gray-400">
      Click to browse
    </span>

    {pdf && (
      <span className="mt-3 text-sm font-medium text-indigo-700">
        ✅ {pdf.name}
      </span>
    )}
  </label>
</div>

        <button className="rounded-xl bg-gray-900 px-5 py-2 text-white">
          Submit Paper
        </button>
      </form>
    </div>
  );
}