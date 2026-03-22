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
  const [subject_area, setSubjectArea] = useState("");
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
    if (openInstituteIndex === index) {
      setOpenInstituteIndex(null);
    }
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

      const authRes = await api.get("/api/files/upload_auth/");
      const { token, signature, expire, publicKey } = authRes.data;

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

      await api.post("/api/papers/create/", {
        title,
        abstract,
        keywords,
        subject_area,
        pdf_url,
        authors,
      });

      setMsg("✅ Paper submitted successfully!");
      setTitle("");
      setAbstract("");
      setKeywords([]);
      setSubjectArea("");
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
        <div>
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Abstract</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Authors</label>

          <div className="mt-2 space-y-3">
            {authors.map((author, index) => {
              const filteredColleges = getFilteredColleges(
                instituteSearches[index] || ""
              );

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 md:grid-cols-5 md:items-start"
                >
                  <input
                    className="rounded-xl border px-3 py-2 md:col-span-2"
                    placeholder="Author Name"
                    value={author.name}
                    onChange={(e) =>
                      handleAuthorChange(index, "name", e.target.value)
                    }
                    required
                  />

                  <div
                    className="relative md:col-span-2"
                    ref={(el) => (instituteRefs.current[index] = el)}
                  >
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 pr-10"
                      placeholder="Search and select institute"
                      value={instituteSearches[index] || ""}
                      onChange={(e) =>
                        handleInstituteSearchChange(index, e.target.value)
                      }
                      onFocus={() => setOpenInstituteIndex(index)}
                      required
                    />

                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                      onClick={() =>
                        setOpenInstituteIndex((prev) =>
                          prev === index ? null : index
                        )
                      }
                    >
                      <ChevronDown size={18} />
                    </button>

                    {openInstituteIndex === index && (
                      <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
                        {filteredColleges.length > 0 ? (
                          filteredColleges.map((college) => (
                            <button
                              key={`${college.id}-${index}`}
                              type="button"
                              className="block w-full border-b px-4 py-2 text-left hover:bg-gray-100"
                              onClick={() =>
                                handleInstituteSelect(index, college)
                              }
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

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAuthor(index)}
                      className="rounded-xl border px-3 py-2 text-sm text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addAuthor}
            className="mt-3 rounded-xl border px-4 py-2 text-sm"
          >
            + Add Co-Author
          </button>
        </div>

        <div ref={topicRef}>
          <label className="text-sm font-medium text-gray-700">Keywords</label>

          <div className="mt-2 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-sm"
              >
                {keyword}
                <button
                  type="button"
                  className="text-gray-700 hover:text-black"
                  onClick={() => removeKeyword(keyword)}
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
              Add Keyword
            </button>

            {showTopicDropdown && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow-lg">
                <input
                  className="w-full border-b px-3 py-2 outline-none"
                  placeholder="Search and select a keyword"
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
                          addKeyword(topic);
                          setTopicSearch("");
                          setShowTopicDropdown(false);
                        }}
                      >
                        {topic}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No matching keyword found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Subject Area
          </label>
          <select
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-400 focus:outline-none focus:ring-0"
            value={subject_area}
            onChange={(e) => setSubjectArea(e.target.value)}
            required
          >
            <option value="">Select subject area</option>
            {subjectAreaOptions.map((domain) => (
              <option key={domain} value={domain}>
                {formatDomainLabel(domain)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            PDF Upload
          </label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
          />
        </div>

        <button
          className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50 cursor-pointer"
        >
          Submit Paper
        </button>
      </form>
    </div>
  );
}