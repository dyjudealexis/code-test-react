import React, { useState, useEffect, useCallback } from "react";
import { ClipLoader } from "react-spinners"; // Import the spinner component

const App = () => {
  const [launches, setLaunches] = useState([]); // Stores fetched launches
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [searchTerm, setSearchTerm] = useState(""); // Search term
  const [hasMore, setHasMore] = useState(true); // Check if more data exists
  const [page, setPage] = useState(0); // Current page for infinite scroll
  const [visibleDescriptions, setVisibleDescriptions] = useState({}); // Visibility state for descriptions
  const limit = 10; // Items per page

  // Fetch launches
  const fetchLaunches = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const query = searchTerm
        ? `&mission_name=${encodeURIComponent(searchTerm)}`
        : "";
      const response = await fetch(
        `https://api.spacexdata.com/v3/launches?limit=${limit}&offset=${
          page * limit
        }${query}&order=desc`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch launches");
      }
      const data = await response.json();
      setLaunches((prev) => [...prev, ...data]);
      setHasMore(data.length === limit); // If fewer results than limit, no more data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, searchTerm]);

  // Fetch launches on page or search term change
  useEffect(() => {
    setLaunches([]); // Reset launches when search term changes
    setPage(0); // Reset page when search term changes
    setHasMore(true); // Reset "hasMore" state
  }, [searchTerm]);

  useEffect(() => {
    fetchLaunches();
  }, [page, fetchLaunches]);

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Toggle description visibility
  const toggleDescription = (flightNumber, index) => {
    const uniqueKey = `${flightNumber}-${index}`; // Create a unique key
    setVisibleDescriptions((prev) => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey], // Toggle visibility using the unique key
    }));
    console.log(uniqueKey);
  };

  const timeAgo = (pastDate) => {
    const now = new Date();
    const date = new Date(pastDate);
    const diffInSeconds = Math.floor((now - date) / 1000);

    const seconds = diffInSeconds;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
      return years === 1 ? "in a year" : `${years} years ago`;
    } else if (months > 0) {
      return months === 1 ? "in a month" : `${months} months ago`;
    } else if (days > 0) {
      return days === 1 ? "in a day" : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? "in an hour" : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? "in a minute" : `${minutes} minutes ago`;
    } else if (seconds > 0) {
      return seconds === 1 ? "in a second" : `${seconds} seconds ago`;
    } else {
      return "just now";
    }
  };

  return (
    <div className="container py-4">
      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control search py-2"
          placeholder="Search by mission name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Launch Cards */}
      {launches.map((launch, index) => (
        <div className="card mb-3 shadow" key={launch.flight_number}>
          <div className="card-body d-flex align-items-start">
            <div>
              <div className="d-flex gap-1 align-items-start">
                <h5 className="card-title fw-bold">{launch.mission_name}</h5>
                <span
                  className={`badge ${
                    launch.launch_success
                      ? "bg-success"
                      : launch.upcoming
                      ? "bg-info"
                      : "bg-danger"
                  } text-lowercase`}
                >
                  {launch.launch_success
                    ? "Success"
                    : launch.upcoming
                    ? "Upcoming"
                    : "Failed"}
                </span>
              </div>

              {visibleDescriptions[`${launch.flight_number}-${index}`] && (
                <>
                  <div className="mb-2 d-flex gap-1">
                    <p className="text-muted mb-2">
                      {timeAgo(launch.launch_date_utc)}
                    </p>
                    {launch.links.article_link && (
                      <>
                        <div className="text-muted">|</div>
                        <a
                          href={launch.links.article_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary fw-medium"
                        >
                          Article
                        </a>
                      </>
                    )}
                    {launch.links.video_link && (
                      <>
                        <div className="text-muted">|</div>
                        <a
                          href={launch.links.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary fw-medium"
                        >
                          Video
                        </a>
                      </>
                    )}
                  </div>

                  <div className="d-flex gap-2 mb-3">
                    <img
                      src={
                        launch.links.mission_patch_small ||
                        "https://via.placeholder.com/100"
                      }
                      alt={`${launch.mission_name} patch`}
                      className="me-3"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "contain",
                      }}
                    />
                    <p className="card-text">
                      {launch.details || "No descriptions yet."}
                    </p>
                  </div>
                </>
              )}

              <button
                className="btn btn-primary me-2 text-uppercase fw-medium"
                onClick={() => toggleDescription(launch.flight_number, index)}
              >
                {visibleDescriptions[`${launch.flight_number}-${index}`]
                  ? "Hide"
                  : "View"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="d-flex justify-content-center mt-4">
          <ClipLoader size={50} color={"#007bff"} loading={loading} />
        </div>
      )}

      {!hasMore && !loading && (
        <p className="text-center mt-4">End of list.</p>
      )}

      {error && <p className="text-danger text-center">{error}</p>}
    </div>
  );
};

export default App;
