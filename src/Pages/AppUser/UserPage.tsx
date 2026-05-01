import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { loadUsers } from "../../services/userService";
import { getSession } from "../../services/authService";
import type { User } from "../../utils/csvParser";

import UserProfileCard from "../../components/user/UserProfileCard";
import FlightsForm from "../../components/user/FlightsForm";
import AccommodationsForm from "../../components/user/AccommodationsForm";
import ActivitiesForm from "../../components/user/ActivitiesForm";
import TransportForm from "../../components/user/TransportForm";
import PointsOfInterestForm from "../../components/user/PointsOfInterestForm";
import TravelPlans from "../../components/user/TravelPlans";

type TabKey =
  | "travels"
  | "flights"
  | "accommodations"
  | "activities"
  | "transport"
  | "pois";

type SearchTabKey = Exclude<TabKey, "travels">;

type TabItem = {
  key: SearchTabKey;
  label: string;
  icon: string;
};

const tabs: TabItem[] = [
  { key: "flights", label: "Flights", icon: "bi-airplane" },
  { key: "accommodations", label: "Accommodations", icon: "bi-building" },
  { key: "activities", label: "Activities", icon: "bi-map" },
  { key: "transport", label: "Transport", icon: "bi-bus-front" },
  { key: "pois", label: "Points of Interest", icon: "bi-geo-alt" },
];

export default function UserPage() {
  const [user, setUser] = useState<User | null>(null);

  // 🔥 FIX: activeTab must allow "travels"
  const [activeTab, setActiveTab] = useState<TabKey>("flights");

  // 🔥 remember last search tab
  const [lastSearchTab, setLastSearchTab] =
    useState<SearchTabKey>("flights");

  useEffect(() => {
    const fetchLoggedUser = async () => {
      try {
        const sessionUser = getSession();

        if (!sessionUser) {
          setUser(null);
          return;
        }

        setUser(sessionUser);

        const allUsers = await loadUsers();
        const updatedUser =
          allUsers.find((u) => u.username === sessionUser.username) || null;

        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchLoggedUser();
  }, []);

  return (
    <>
      <Navbar />

      <div className="user-page container mt-4 mb-5">
        <h2 className="mb-4 text-center">User Page</h2>

        <UserProfileCard user={user} />

        {/* BUTTON TO SWITCH VIEWS */}
        <div className="d-flex justify-content-center mb-4">
          {activeTab === "travels" ? (
            <button
              type="button"
              className="btn btn-outline-light btn-lg"
              onClick={() => setActiveTab(lastSearchTab)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Search
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline-primary btn-lg"
              onClick={() => setActiveTab("travels")}
            >
              <i className="bi bi-suitcase me-2"></i>
              My Travels
            </button>
          )}
        </div>

        {/* CONDITIONAL VIEW */}
        {activeTab === "travels" ? (
          <div className="card bg-dark text-light shadow">
            <div className="card-body">
              <TravelPlans />
            </div>
          </div>
        ) : (
          <div className="card bg-dark text-light shadow">
            <div className="card-body">
              <div className="row g-4">
                {/* LEFT TABS */}
                <div className="col-12 col-lg-3">
                  <div
                    className="nav nav-pills user-tabs-container"
                    role="tablist"
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`nav-link user-tab-button ${
                          activeTab === tab.key ? "active" : ""
                        }`}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setLastSearchTab(tab.key); 
                        }}
                        title={tab.label}
                        aria-label={tab.label}
                      >
                        <i className={`bi ${tab.icon}`}></i>
                        <span className="tab-text">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-12 col-lg-9">
                  <div className="p-3 rounded bg-secondary bg-opacity-10">
                    {activeTab === "flights" && <FlightsForm />}
                    {activeTab === "accommodations" && (
                      <AccommodationsForm />
                    )}
                    {activeTab === "activities" && <ActivitiesForm />}
                    {activeTab === "transport" && <TransportForm />}
                    {activeTab === "pois" && <PointsOfInterestForm />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}