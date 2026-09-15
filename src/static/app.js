document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? "message error" : "message success";

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function unregisterParticipant(activity, email, button) {
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to unregister participant");
      }

      showMessage(result.message);
      await fetchActivities();
    } catch (error) {
      showMessage(error.message || "Failed to unregister participant.", true);
      button.disabled = false;
      console.error("Error unregistering participant:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }

      const activities = await response.json();
      const selectedActivity = activitySelect.value;

      // Clear old cards and options before rebuilding the current state
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No students signed up yet.";
          participantsSection.appendChild(emptyMessage);
        } else {
          const participantList = document.createElement("ul");
          participantList.className = "participant-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const unregisterButton = document.createElement("button");
            unregisterButton.type = "button";
            unregisterButton.className = "unregister-button";
            unregisterButton.textContent = "\u00d7";
            unregisterButton.title = `Unregister ${email}`;
            unregisterButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            unregisterButton.addEventListener("click", () => {
              unregisterParticipant(name, email, unregisterButton);
            });

            participant.append(participantEmail, unregisterButton);
            participantList.appendChild(participant);
          });

          participantsSection.appendChild(participantList);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (Object.hasOwn(activities, selectedActivity)) {
        activitySelect.value = selectedActivity;
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", true);
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", true);
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
