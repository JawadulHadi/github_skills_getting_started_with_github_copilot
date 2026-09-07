document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createTextElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = textContent;
    return element;
  }

  function createLabeledParagraph(label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = `${label}:`;
    paragraph.appendChild(strong);
    paragraph.append(` ${value}`);
    return paragraph;
  }

  function createParticipantSection(activityName, participants) {
    const section = document.createElement("div");
    section.className = "participants-section";

    const header = document.createElement("div");
    header.className = "participants-header";

    const heading = document.createElement("h5");
    heading.textContent = "Participants";

    const count = document.createElement("span");
    count.textContent = `${participants.length} signed up`;

    header.appendChild(heading);
    header.appendChild(count);
    section.appendChild(header);

    if (participants.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-participants";
      emptyState.textContent = "No one has signed up yet.";
      section.appendChild(emptyState);
      return section;
    }

    const list = document.createElement("ul");
    list.className = "participants-list";

    participants.forEach((participant) => {
      const item = document.createElement("li");
      item.className = "participant-item";

      const email = document.createElement("span");
      email.className = "participant-email";
      email.textContent = participant;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "participant-remove-button";
      removeButton.dataset.activity = activityName;
      removeButton.dataset.email = participant;
      removeButton.setAttribute("aria-label", `Remove ${participant} from ${activityName}`);
      removeButton.title = "Remove participant";
      removeButton.textContent = "×";

      item.appendChild(email);
      item.appendChild(removeButton);
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.replaceChildren();
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        activityCard.appendChild(createTextElement("h4", "", name));
        activityCard.appendChild(createTextElement("p", "", details.description));
        activityCard.appendChild(createLabeledParagraph("Schedule", details.schedule));
        activityCard.appendChild(createLabeledParagraph("Availability", `${spotsLeft} spots left`));
        activityCard.appendChild(createParticipantSection(name, details.participants));

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.textContent = "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-button");

    if (!removeButton) {
      return;
    }

    const activity = removeButton.dataset.activity;
    const email = removeButton.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
