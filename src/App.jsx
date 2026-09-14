import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";

const NAV_ITEMS = [
  { id: "dashboard", icon: "⌂", label: "Home" },
  { id: "issues", icon: "◈", label: "Issues" },
  { id: "report", icon: "+", label: "Report" },
  { id: "suggestions", icon: "✦", label: "Ideas" },
  { id: "events", icon: "◷", label: "Events" },
  { id: "announcements", icon: "◉", label: "Notices" },
  { id: "emergency", icon: "🚨", label: "Emergency" },
  { id: "polls", icon: "🗳️", label: "Polls" },
  { id: "lostfound", icon: "🔎", label: "Lost & Found" },
];

const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Resolved"];

function SearchBar({ search, setSearch }) {
  return (
    <div className="search-bar">
      <span>⌕</span>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search issues, locations or keywords..."
      />
      {search && (
        <button type="button" onClick={() => setSearch("")}>
          ×
        </button>
      )}
    </div>
  );
}

function StableView({ render }) {
  return render();
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [issues, setIssues] = useState([]);
  const [votedIssues, setVotedIssues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [votedSuggestions, setVotedSuggestions] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [pollOptions, setPollOptions] = useState([]);
  const [pollVotes, setPollVotes] = useState([]);
  const [pollResults, setPollResults] = useState({});
  const [lostFound, setLostFound] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [anonymous, setAnonymous] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionDescription, setSuggestionDescription] = useState("");
  const [suggestionAnonymous, setSuggestionAnonymous] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [emergencyTitle, setEmergencyTitle] = useState("");
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencySeverity, setEmergencySeverity] = useState("Critical");
  const [emergencyExpiry, setEmergencyExpiry] = useState("");

  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollEndsAt, setPollEndsAt] = useState("");
  const [pollOptionText, setPollOptionText] = useState("");
  const [pollOptionDrafts, setPollOptionDrafts] = useState([]);

  const [lfTitle, setLfTitle] = useState("");
  const [lfDescription, setLfDescription] = useState("");
  const [lfType, setLfType] = useState("LOST");
  const [lfLocation, setLfLocation] = useState("");
  const [lfDate, setLfDate] = useState("");
  const [lfImage, setLfImage] = useState(null);
  const [lfFilter, setLfFilter] = useState("ALL");
  const [lfSearch, setLfSearch] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    getCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      if (newSession) {
        loadProfile(newSession);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadEverything();
  }, [session]);

  async function getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setMessage(error.message);
      return;
    }

    setSession(data.session);

    if (data.session) {
      await loadProfile(data.session);
    }
  }

  async function loadProfile(currentSession) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentSession.user.id)
      .maybeSingle();

    setProfile(data || null);
  }

  async function login() {
    if (!email || !password) {
      return setMessage("Enter email and password.");
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      return setMessage(error.message);
    }

    setMessage("Welcome back! 👋");
  }

  async function signup() {
    if (!email || !password) {
      return setMessage("Enter email and password.");
    }

    if (password.length < 6) {
      return setMessage("Password must be at least 6 characters.");
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      return setMessage(error.message);
    }

    setMessage("Account created! Check your email if required.");
  }

  async function forgotPassword() {
    if (!email.trim()) {
      return setMessage("Enter your email address first.");
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      return setMessage(error.message);
    }

    setMessage("Password reset link sent. Check your email.");
  }

  async function updatePassword() {
    if (newPassword.length < 6) {
      return setMessage(
        "New password must be at least 6 characters."
      );
    }

    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      return setMessage(error.message);
    }

    setNewPassword("");
    setConfirmPassword("");
    setRecoveryMode(false);

    setMessage("Password changed successfully. 🔐");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRecoveryMode(false);
  }

  async function loadEverything() {
    await Promise.all([
      loadIssues(),
      loadVotedIssues(),
      loadAnnouncements(),
      loadCategories(),
      loadSuggestions(),
      loadSuggestionVotes(),
      loadEvents(),
      loadNotifications(),
      loadEmergencyAlerts(),
      loadAcknowledgements(),
      loadPolls(),
      loadPollOptions(),
      loadPollVotes(),
      loadLostFound(),
    ]);
  }

  async function loadIssues() {
    const { data, error } = await supabase
      .from("issues")
      .select("*, categories(name, icon)")
      .order("votes", { ascending: false });

    if (!error) {
      setIssues(data || []);
      return;
    }

    const fallback = await supabase
      .from("issues")
      .select("*")
      .order("votes", { ascending: false });

    if (!fallback.error) {
      setIssues(fallback.data || []);
    }
  }

  async function loadVotedIssues() {
    const { data } = await supabase
      .from("issue_votes")
      .select("issue_id")
      .eq("user_id", session.user.id);

    setVotedIssues(
      (data || []).map((x) => x.issue_id)
    );
  }

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  }

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    setCategories(data || []);
  }

  async function loadSuggestions() {
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("votes", { ascending: false });

    setSuggestions(data || []);
  }

  async function loadSuggestionVotes() {
    const { data } = await supabase
      .from("suggestion_votes")
      .select("suggestion_id")
      .eq("user_id", session.user.id);

    setVotedSuggestions(
      (data || []).map((x) => x.suggestion_id)
    );
  }

  async function loadEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    setEvents(data || []);
  }

  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }

  async function loadEmergencyAlerts() {
    const { data } = await supabase
      .from("emergency_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    setEmergencyAlerts(data || []);
  }

  async function loadAcknowledgements() {
    const { data } = await supabase
      .from("emergency_acknowledgements")
      .select("alert_id")
      .eq("user_id", session.user.id);

    setAcknowledgedAlerts(
      (data || []).map((x) => x.alert_id)
    );
  }

  async function loadPolls() {
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return setMessage(error.message);
    }

    const rows = data || [];

    setPolls(rows);

    if (rows.length) {
      const entries = await Promise.all(
        rows.map(async (poll) => {
          const { data: results } = await supabase.rpc(
            "get_poll_results",
            {
              p_poll_id: poll.id,
            }
          );

          return [poll.id, results || []];
        })
      );

      setPollResults(Object.fromEntries(entries));
    } else {
      setPollResults({});
    }
  }

  async function loadPollOptions() {
    const { data } = await supabase
      .from("poll_options")
      .select("*");

    setPollOptions(data || []);
  }

  async function loadPollVotes() {
    const { data } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id")
      .eq("user_id", session.user.id);

    setPollVotes(data || []);
  }

  async function loadLostFound() {
    const { data } = await supabase
      .from("lost_found")
      .select("*")
      .order("created_at", { ascending: false });

    setLostFound(data || []);
  }

  async function moderateTextAndImage(text, file) {
    const body = {
      text: text || "",
    };

    if (file) {
      const base64 = await fileToBase64(file);

      body.image_base64 = base64;
      body.image_mime = file.type;
    }

    const { data, error } =
      await supabase.functions.invoke(
        "moderate-content",
        {
          body,
        }
      );

    if (error) {
      let detail = "";

      try {
        if (error.context?.json) {
          const payload =
            await error.context.json();

          detail =
            payload?.reason ||
            payload?.message ||
            "";
        }
      } catch {}

      const name =
        error?.constructor?.name || "";

      if (name === "FunctionsFetchError") {
        throw new Error(
          "The moderation service is unreachable. Deploy the 'moderate-content' Supabase Edge Function, then try again."
        );
      }

      if (name === "FunctionsRelayError") {
        throw new Error(
          "Supabase could not reach the moderation function. Check the function deployment and Supabase Function Logs."
        );
      }

      throw new Error(
        detail ||
          error.message ||
          "Content moderation service is unavailable. Please try again."
      );
    }

    if (!data?.allowed) {
      throw new Error(
        data?.reason ||
          "This content cannot be submitted."
      );
    }

    return true;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(
          String(reader.result).split(",")[1] || ""
        );

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setImage(null);
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image.");
      event.target.value = "";
      return;
    }

    setImage(file);
    setImagePreview(
      URL.createObjectURL(file)
    );
    setMessage("");
  }

  async function submitIssue(event) {
    event.preventDefault();

    if (!session) {
      return setMessage("Please login first.");
    }

    if (
      !title.trim() ||
      !description.trim()
    ) {
      return setMessage(
        "Please complete the title and description."
      );
    }

    setLoading(true);
    setMessage(
      "Checking report content..."
    );

    try {
      await moderateTextAndImage(
        `${title.trim()}\n${description.trim()}`,
        image
      );

      let imageUrl = null;

      if (image) {
        setMessage("Uploading evidence...");

        const extension =
          image.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `${session.user.id}/${Date.now()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("issue-images")
            .upload(
              fileName,
              image,
              {
                cacheControl: "3600",
                upsert: false,
                contentType: image.type,
              }
            );

        if (uploadError) {
          throw new Error(
            "Image upload failed: " +
              uploadError.message
          );
        }

        imageUrl =
          supabase.storage
            .from("issue-images")
            .getPublicUrl(fileName)
            .data.publicUrl;
      }

      const issueData = {
        title: title.trim(),
        description: description.trim(),
        status: "Pending",
        votes: 0,
        priority,
        anonymous,
        location:
          location.trim() || null,
        category_id:
          categoryId
            ? Number(categoryId)
            : null,
        user_id: session.user.id,
      };

      if (imageUrl) {
        issueData.image_url =
          imageUrl;
      }

      const { error } =
        await supabase
          .from("issues")
          .insert(issueData);

      if (error) {
        throw new Error(
          "Report failed: " +
            error.message
        );
      }

      setTitle("");
      setDescription("");
      setCategoryId("");
      setLocation("");
      setPriority("Medium");
      setAnonymous(false);
      setImage(null);
      setImagePreview(null);

      const input =
        document.getElementById(
          "issue-image"
        );

      if (input) {
        input.value = "";
      }

      setMessage(
        "Report submitted successfully! 🚀"
      );

      await loadIssues();
      goTo("issues");
    } catch (error) {
      setMessage(
        error?.message ||
          "Could not submit report."
      );
    }

    setLoading(false);
  }

  async function vote(issueId) {
    if (votedIssues.includes(issueId)) {
      return setMessage(
        "You already supported this issue."
      );
    }

    const { error } =
      await supabase
        .from("issue_votes")
        .insert({
          issue_id: issueId,
          user_id: session.user.id,
        });

    if (error) {
      return setMessage(
        error.code === "23505"
          ? "You already voted."
          : "Vote failed: " +
              error.message
      );
    }

    setVotedIssues((old) => [
      ...old,
      issueId,
    ]);

    await loadIssues();

    setMessage(
      "Your vote has been counted! 👍"
    );
  }

  async function changeStatus(
    id,
    status
  ) {
    if (profile?.role !== "admin")
      return;

    const { error } =
      await supabase
        .from("issues")
        .update({ status })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadIssues();
  }

  async function deleteIssue(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this complaint permanently?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("issues")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    setSelectedIssue(null);

    await loadIssues();
  }

  async function postAnnouncement(e) {
    e.preventDefault();

    if (profile?.role !== "admin")
      return;

    if (
      !announcementTitle.trim() ||
      !announcementContent.trim()
    ) {
      return setMessage(
        "Complete the announcement."
      );
    }

    const { error } =
      await supabase
        .from("announcements")
        .insert({
          title:
            announcementTitle.trim(),
          content:
            announcementContent.trim(),
        });

    if (error) {
      return setMessage(
        error.message
      );
    }

    setAnnouncementTitle("");
    setAnnouncementContent("");

    await loadAnnouncements();

    setMessage(
      "Announcement published! 📢"
    );
  }

  async function deleteAnnouncement(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this announcement?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadAnnouncements();
  }

  async function submitSuggestion(e) {
    e.preventDefault();

    if (
      !suggestionTitle.trim() ||
      !suggestionDescription.trim()
    ) {
      return setMessage(
        "Complete your suggestion."
      );
    }

    setLoading(true);

    const { error } =
      await supabase
        .from("suggestions")
        .insert({
          user_id: session.user.id,
          title:
            suggestionTitle.trim(),
          description:
            suggestionDescription.trim(),
          anonymous:
            suggestionAnonymous,
          votes: 0,
          status: "Pending",
        });

    setLoading(false);

    if (error) {
      return setMessage(
        error.message
      );
    }

    setSuggestionTitle("");
    setSuggestionDescription("");
    setSuggestionAnonymous(false);

    await loadSuggestions();

    setMessage(
      "Idea submitted! 💡"
    );
  }

  async function voteSuggestion(id) {
    if (
      votedSuggestions.includes(id)
    ) {
      return setMessage(
        "You already supported this idea."
      );
    }

    const { error } =
      await supabase
        .from("suggestion_votes")
        .insert({
          suggestion_id: id,
          user_id: session.user.id,
        });

    if (error) {
      return setMessage(
        error.message
      );
    }

    setVotedSuggestions((old) => [
      ...old,
      id,
    ]);

    await loadSuggestions();
  }

  async function changeSuggestionStatus(
    id,
    status
  ) {
    if (profile?.role !== "admin")
      return;

    const { error } =
      await supabase
        .from("suggestions")
        .update({ status })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadSuggestions();
  }

  async function deleteSuggestion(id) {
    if (profile?.role !== "admin")
      return;

    if (
      !window.confirm(
        "Delete this idea permanently?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("suggestions")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadSuggestions();

    setMessage("Idea deleted.");
  }

  async function createEvent(e) {
    e.preventDefault();

    if (profile?.role !== "admin")
      return;

    if (
      !eventTitle.trim() ||
      !eventDescription.trim() ||
      !eventDate
    ) {
      return setMessage(
        "Complete the event details."
      );
    }

    const { error } =
      await supabase
        .from("events")
        .insert({
          title:
            eventTitle.trim(),
          description:
            eventDescription.trim(),
          location:
            eventLocation.trim() ||
            null,
          event_date:
            new Date(
              eventDate
            ).toISOString(),
          created_by:
            session.user.id,
        });

    if (error) {
      return setMessage(
        error.message
      );
    }

    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventDate("");

    await loadEvents();
  }

  async function deleteEvent(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this event?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("events")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadEvents();
  }

  // Emergency Broadcast

  async function createEmergency(e) {
    e.preventDefault();

    if (profile?.role !== "admin")
      return;

    if (
      !emergencyTitle.trim() ||
      !emergencyMessage.trim()
    ) {
      return setMessage(
        "Complete the emergency alert."
      );
    }

    const { error } =
      await supabase
        .from("emergency_alerts")
        .insert({
          title:
            emergencyTitle.trim(),
          message:
            emergencyMessage.trim(),
          severity:
            emergencySeverity,
          expires_at:
            emergencyExpiry
              ? new Date(
                  emergencyExpiry
                ).toISOString()
              : null,
          created_by:
            session.user.id,
          active: true,
        });

    if (error) {
      return setMessage(
        error.message
      );
    }

    setEmergencyTitle("");
    setEmergencyMessage("");
    setEmergencyExpiry("");

    await loadEmergencyAlerts();

    setMessage(
      "Emergency broadcast sent! 🚨"
    );
  }

  async function acknowledgeEmergency(
    id
  ) {
    const { error } =
      await supabase
        .from(
          "emergency_acknowledgements"
        )
        .insert({
          alert_id: id,
          user_id: session.user.id,
        });

    if (
      error &&
      error.code !== "23505"
    ) {
      return setMessage(
        error.message
      );
    }

    setAcknowledgedAlerts((old) =>
      old.includes(id)
        ? old
        : [...old, id]
    );
  }

  async function toggleEmergency(
    id,
    active
  ) {
    if (profile?.role !== "admin")
      return;

    const { error } =
      await supabase
        .from("emergency_alerts")
        .update({ active })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadEmergencyAlerts();
  }

  async function deleteEmergency(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this emergency alert?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("emergency_alerts")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadEmergencyAlerts();
  }

  // Polls

  async function createPoll(e) {
    e.preventDefault();

    if (profile?.role !== "admin")
      return;

    const options =
      pollOptionDrafts
        .map((x) => x.trim())
        .filter(Boolean);

    if (
      !pollTitle.trim() ||
      options.length < 2
    ) {
      return setMessage(
        "A poll needs a title and at least 2 options."
      );
    }

    const {
      data: poll,
      error,
    } = await supabase
      .from("polls")
      .insert({
        title:
          pollTitle.trim(),
        description:
          pollDescription.trim() ||
          null,
        ends_at: pollEndsAt
          ? new Date(
              pollEndsAt
            ).toISOString()
          : null,
        created_by:
          session.user.id,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return setMessage(
        error.message
      );
    }

    const {
      error: optionError,
    } = await supabase
      .from("poll_options")
      .insert(
        options.map(
          (option_text) => ({
            poll_id: poll.id,
            option_text,
          })
        )
      );

    if (optionError) {
      await supabase
        .from("polls")
        .delete()
        .eq("id", poll.id);

      return setMessage(
        optionError.message
      );
    }

    setPollTitle("");
    setPollDescription("");
    setPollEndsAt("");
    setPollOptionDrafts([]);

    await loadPolls();
    await loadPollOptions();

    setMessage(
      "Poll created! 🗳️"
    );
  }

  function pollIsClosed(poll) {
    if (!poll) return true;

    const explicitlyClosed =
      poll.active === false ||
      poll.active === 0 ||
      String(
        poll.active
      ).toLowerCase() === "false" ||
      String(
        poll.active
      ) === "0";

    const endTime = poll.ends_at
      ? new Date(
          poll.ends_at
        ).getTime()
      : NaN;

    return (
      explicitlyClosed ||
      (
        Number.isFinite(endTime) &&
        endTime <= Date.now()
      )
    );
  }

  async function votePoll(
    pollId,
    optionId
  ) {
    if (!session?.user?.id) {
      return setMessage(
        "Please log in before voting."
      );
    }

    if (
      pollVotes.some(
        (v) =>
          String(v.poll_id) ===
          String(pollId)
      )
    ) {
      return setMessage(
        "You already voted in this poll."
      );
    }

    const poll = polls.find(
      (p) =>
        String(p.id) ===
        String(pollId)
    );

    if (!poll) {
      return setMessage(
        "Poll not found. Refresh the page and try again."
      );
    }

    if (pollIsClosed(poll)) {
      return setMessage(
        "This poll is closed."
      );
    }

    const option =
      pollOptions.find(
        (o) =>
          String(o.id) ===
            String(optionId) &&
          String(o.poll_id) ===
            String(pollId)
      );

    if (!option) {
      return setMessage(
        "Poll option not found. Refresh the page and try again."
      );
    }

    setMessage(
      "Recording your vote…"
    );

    let result =
      await supabase.rpc(
        "cast_poll_vote",
        {
          p_poll_id: pollId,
          p_option_id: optionId,
        }
      );

    if (
      result.error &&
      /function .*cast_poll_vote.*does not exist|could not find the function/i.test(
        result.error.message || ""
      )
    ) {
      result =
        await supabase
          .from("poll_votes")
          .insert({
            poll_id: pollId,
            option_id: optionId,
            user_id:
              session.user.id,
          });
    }

    if (result.error) {
      if (
        result.error.code ===
        "23505"
      ) {
        return setMessage(
          "You already voted in this poll."
        );
      }

      return setMessage(
        "Vote failed: " +
          (
            result.error.message ||
            "Database error"
          )
      );
    }

    setPollVotes((old) =>
      old.some(
        (v) =>
          String(v.poll_id) ===
          String(pollId)
      )
        ? old
        : [
            ...old,
            {
              poll_id: pollId,
              option_id:
                optionId,
            },
          ]
    );

    await loadPollResult(
      pollId
    );

    setMessage(
      "Vote recorded! 🗳️"
    );
  }

  async function loadPollResult(
    pollId
  ) {
    const { data } =
      await supabase.rpc(
        "get_poll_results",
        {
          p_poll_id: pollId,
        }
      );

    setPollResults((old) => ({
      ...old,
      [pollId]: data || [],
    }));
  }

  async function closePoll(id) {
    if (profile?.role !== "admin")
      return;

    const { error } =
      await supabase
        .from("polls")
        .update({
          active: false,
        })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadPolls();
  }

  async function deletePoll(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this poll?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("polls")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadPolls();
    await loadPollOptions();
  }

  // Lost & Found

  async function createLostFound(e) {
    e.preventDefault();

    if (!session?.user?.id) {
      return setMessage(
        "Please log in before posting an item."
      );
    }

    if (
      !lfTitle.trim() ||
      !lfDescription.trim()
    ) {
      return setMessage(
        "Add an item name and description first."
      );
    }

    if (
      lfImage &&
      !lfImage.type.startsWith(
        "image/"
      )
    ) {
      return setMessage(
        "Please choose an image file."
      );
    }

    if (
      lfImage &&
      lfImage.size >
        8 * 1024 * 1024
    ) {
      return setMessage(
        "Photo must be 8 MB or smaller."
      );
    }

    setLoading(true);
    setMessage(
      "Posting your item…"
    );

    try {
      let imageUrl = null;
      let uploadWarning = "";

      if (lfImage) {
        const ext =
          lfImage.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const path =
          `${session.user.id}/lost-found-${Date.now()}.${ext}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("issue-images")
          .upload(
            path,
            lfImage,
            {
              upsert: false,
              contentType:
                lfImage.type,
              cacheControl:
                "3600",
            }
          );

        if (uploadError) {
          uploadWarning =
            ` Photo could not be uploaded (${uploadError.message}), but your post was saved without the photo.`;
        } else {
          imageUrl =
            supabase.storage
              .from("issue-images")
              .getPublicUrl(path)
              .data.publicUrl;
        }
      }

      const basePayload = {
        title:
          lfTitle.trim(),
        description:
          lfDescription.trim(),
        item_type: lfType,
        location:
          lfLocation.trim() ||
          null,
        item_date: lfDate
          ? new Date(
              lfDate
            ).toISOString()
          : null,
        user_id:
          session.user.id,
      };

      let payload = {
        ...basePayload,
        image_url: imageUrl,
        status: "Open",
        moderation_status:
          "Pending",
      };

      let { error } =
        await supabase
          .from("lost_found")
          .insert(payload);

      /*
       * If the table is missing an optional column,
       * retry with only the core columns.
       */
      if (
        error &&
        /column .* does not exist|schema cache/i.test(
          error.message || ""
        )
      ) {
        ({
          error,
        } =
          await supabase
            .from("lost_found")
            .insert(
              basePayload
            ));
      }

      if (error) {
        throw new Error(
          `Could not save the post: ${error.message}${
            error.code
              ? ` [${error.code}]`
              : ""
          }`
        );
      }

      setLfTitle("");
      setLfDescription("");
      setLfLocation("");
      setLfDate("");
      setLfImage(null);

      const fileInput =
        document.getElementById(
          "lost-found-image"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadLostFound();

      setMessage(
        `Posted successfully. Your item is waiting for admin approval.${uploadWarning}`
      );
    } catch (error) {
      setMessage(
        error?.message ||
          "Could not post the item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function moderateLostFound(
    id,
    moderation_status
  ) {
    if (profile?.role !== "admin")
      return;

    const { error } =
      await supabase
        .from("lost_found")
        .update({
          moderation_status,
        })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadLostFound();
  }

  async function updateLostStatus(
    id,
    status
  ) {
    const { error } =
      await supabase
        .from("lost_found")
        .update({ status })
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadLostFound();
  }

  async function deleteLostFound(id) {
    if (
      profile?.role !== "admin" ||
      !window.confirm(
        "Delete this post?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("lost_found")
        .delete()
        .eq("id", id);

    if (error) {
      return setMessage(
        error.message
      );
    }

    await loadLostFound();
  }

  const filteredIssues =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return issues.filter(
        (issue) => {
          const matchesSearch =
            !query ||
            [
              issue.title,
              issue.description,
              issue.location,
            ].some((v) =>
              (v || "")
                .toLowerCase()
                .includes(query)
            );

          return (
            matchesSearch &&
            (
              filter === "All" ||
              issue.status === filter
            )
          );
        }
      );
    }, [
      issues,
      search,
      filter,
    ]);

  const totalIssues =
    issues.length;

  const pendingIssues =
    issues.filter(
      (x) =>
        x.status ===
        "Pending"
    ).length;

  const progressIssues =
    issues.filter(
      (x) =>
        x.status ===
        "In Progress"
    ).length;

  const resolvedIssues =
    issues.filter(
      (x) =>
        x.status ===
        "Resolved"
    ).length;

  const unreadNotifications =
    notifications.filter(
      (x) => !x.read
    ).length;

  function goTo(target) {
    setPage(target);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getGreeting() {
    const h =
      new Date().getHours();

    return h < 12
      ? "Good morning"
      : h < 17
      ? "Good afternoon"
      : "Good evening";
  }

  function getCategory(issue) {
    if (issue.categories) {
      return `${issue.categories.icon || "◈"} ${issue.categories.name}`;
    }

    const c =
      categories.find(
        (x) =>
          x.id ===
          issue.category_id
      );

    return c
      ? `${c.icon || "◈"} ${c.name}`
      : "◈ General";
  }

  function priorityClass(value) {
    return (
      value || "Medium"
    ).toLowerCase();
  }

  if (recoveryMode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand-mark">
            C
          </div>

          <div className="auth-brand">
            <h1>
              College
              <span>
                Connect
              </span>
            </h1>
            <p>
              Secure password recovery.
            </p>
          </div>

          <div className="auth-heading">
            <h2>
              Create a new password.
            </h2>
            <p>
              Choose a new password
              for your account.
            </p>
          </div>

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
          />

          <button
            className="primary big-button"
            onClick={updatePassword}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Update password →"}
          </button>

          {message && (
            <div className="message-box">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-glow glow-one" />
        <div className="auth-glow glow-two" />

        <div className="auth-card">
          <div className="brand-mark">
            C
          </div>

          <div className="auth-brand">
            <h1>
              College
              <span>
                Connect
              </span>
            </h1>

            <p>
              Your campus. Connected.
            </p>
          </div>

          <div className="auth-heading">
            <h2>
              Welcome back.
            </h2>

            <p>
              Sign in to your campus
              community.
            </p>
          </div>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button
            className="primary big-button"
            onClick={login}
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in →"}
          </button>

          <button
            className="secondary"
            onClick={signup}
            disabled={loading}
          >
            Create new account
          </button>

          <button
            className="text-button"
            onClick={forgotPassword}
            disabled={loading}
          >
            Forgot password?
          </button>

          {message && (
            <div className="message-box">
              {message}
            </div>
          )}

          <div className="auth-footer">
            <span>
              College issues.
            </span>
            <span>
              Ideas.
            </span>
            <span>
              Community.
            </span>
          </div>
        </div>
      </div>
    );
  }

  function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mini-logo">
            C
          </div>

          <div>
            <strong>
              CollegeConnect
            </strong>
            <small>
              Campus OS
            </small>
          </div>
        </div>

        <nav>
          {NAV_ITEMS.map(
            (item) => (
              <button
                key={item.id}
                className={
                  page === item.id
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  goTo(item.id)
                }
              >
                <span className="nav-icon">
                  {item.icon}
                </span>
                <span>
                  {item.label}
                </span>
              </button>
            )
          )}

          <button
            className={
              page ===
              "notifications"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              goTo(
                "notifications"
              )
            }
          >
            <span className="nav-icon">
              ♢
            </span>

            <span>
              Notifications
            </span>

            {unreadNotifications >
              0 && (
              <b className="notification-count">
                {
                  unreadNotifications
                }
              </b>
            )}
          </button>
        </nav>

        {profile?.role ===
          "admin" && (
          <div className="admin-side">
            <p>ADMIN</p>

            <button
              className={
                page === "admin"
                  ? "nav-item active admin-nav"
                  : "nav-item admin-nav"
              }
              onClick={() =>
                goTo("admin")
              }
            >
              <span className="nav-icon">
                ◆
              </span>
              Command Center
            </button>
          </div>
        )}

        <div className="sidebar-bottom">
          <button
            className="profile-mini"
            onClick={() =>
              goTo("profile")
            }
          >
            <div className="avatar">
              {(
                session.user.email?.[0] ||
                "U"
              ).toUpperCase()}
            </div>

            <div className="profile-mini-text">
              <strong>
                {profile?.role ===
                "admin"
                  ? "Administrator"
                  : "Student"}
              </strong>

              <small>
                {
                  session.user.email
                }
              </small>
            </div>
          </button>

          <button
            className="logout-side"
            onClick={logout}
          >
            ↪
          </button>
        </div>
      </aside>
    );
  }

  function MobileNav() {
    return (
      <div className="mobile-nav">
        {NAV_ITEMS.slice(
          0,
          5
        ).map((item) => (
          <button
            key={item.id}
            className={
              page === item.id
                ? "mobile-nav-item active"
                : "mobile-nav-item"
            }
            onClick={() =>
              goTo(item.id)
            }
          >
            <span>
              {item.icon}
            </span>

            <small>
              {item.label}
            </small>
          </button>
        ))}
      </div>
    );
  }

  function TopBar() {
    return (
      <header className="topbar">
        <div className="topbar-title">
          <button
            className="mobile-brand"
            onClick={() =>
              goTo("dashboard")
            }
          >
            <div className="mini-logo">
              C
            </div>

            <strong>
              CollegeConnect
            </strong>
          </button>

          <div className="desktop-page-title">
            <span>
              Campus /
            </span>

            <strong>
              {page ===
              "dashboard"
                ? "Overview"
                : page === "admin"
                ? "Command Center"
                : page
                    .replace(
                      "lostfound",
                      "Lost & Found"
                    )
                    .replace(
                      "emergency",
                      "Emergency"
                    )
                    .replace(
                      "polls",
                      "Polls"
                    )
                    .replace(
                      "announcements",
                      "Notices"
                    )
                    .replace(
                      "suggestions",
                      "Ideas"
                    )
                    .replace(
                      "issues",
                      "Issues"
                    )
                    .replace(
                      "report",
                      "Report"
                    )
                    .replace(
                      "events",
                      "Events"
                    )}
            </strong>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="top-icon"
            onClick={() =>
              goTo(
                "notifications"
              )
            }
          >
            ♢
            {unreadNotifications >
              0 && (
              <i>
                {
                  unreadNotifications
                }
              </i>
            )}
          </button>

          <button
            className="top-profile"
            onClick={() =>
              goTo("profile")
            }
          >
            <div className="avatar">
              {(
                session.user.email?.[0] ||
                "U"
              ).toUpperCase()}
            </div>

            <span>
              {profile?.role ===
              "admin"
                ? "Admin"
                : "Student"}
            </span>
          </button>
        </div>
      </header>
    );
  }

  function StatCard({
    number,
    label,
    icon,
    className,
  }) {
    return (
      <div
        className={`stat-card ${
          className || ""
        }`}
      >
        <div className="stat-icon">
          {icon}
        </div>

        <strong>
          {number}
        </strong>

        <span>
          {label}
        </span>
      </div>
    );
  }

  function EmptyState({
    icon,
    title,
    text,
  }) {
    return (
      <div className="empty-state">
        <div>{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    );
  }

  function IssueCard({ issue }) {
    return (
      <article
        className="issue-card-v2"
        onClick={() =>
          setSelectedIssue(issue)
        }
      >
        <div className="issue-card-header">
          <div className="category-chip">
            {getCategory(issue)}
          </div>

          <span
            className={`priority ${priorityClass(
              issue.priority
            )}`}
          >
            {issue.priority ||
              "Medium"}
          </span>
        </div>

        <div className="issue-card-title">
          <h3>
            {issue.title}
          </h3>

          <span
            className={`status ${issue.status
              .toLowerCase()
              .replace(
                " ",
                "-"
              )}`}
          >
            {issue.status}
          </span>
        </div>

        <p className="issue-description">
          {issue.description}
        </p>

        {issue.image_url && (
          <img
            className="issue-thumb"
            src={issue.image_url}
            alt=""
          />
        )}

        <div className="issue-meta">
          {issue.location && (
            <span>
              ⌖ {issue.location}
            </span>
          )}

          <span>
            {issue.anonymous
              ? "◌ Anonymous"
              : "● Student"}
          </span>

          <span>
            {new Date(
              issue.created_at
            ).toLocaleDateString()}
          </span>
        </div>

        <div className="issue-card-footer">
          <button
            className={
              votedIssues.includes(
                issue.id
              )
                ? "vote-button voted"
                : "vote-button"
            }
            onClick={(e) => {
              e.stopPropagation();
              vote(issue.id);
            }}
          >
            {votedIssues.includes(
              issue.id
            )
              ? "✓ Supported"
              : "↑ Support"}

            <b>
              {issue.votes || 0}
            </b>
          </button>

          {profile?.role ===
            "admin" && (
            <div
              className="admin-card-actions"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <select
                value={issue.status}
                onChange={(e) =>
                  changeStatus(
                    issue.id,
                    e.target.value
                  )
                }
              >
                <option>
                  Pending
                </option>
                <option>
                  In Progress
                </option>
                <option>
                  Resolved
                </option>
              </select>

              <button
                className="icon-delete"
                onClick={() =>
                  deleteIssue(
                    issue.id
                  )
                }
              >
                ×
              </button>
            </div>
          )}

          <span className="open-arrow">
            ↗
          </span>
        </div>
      </article>
    );
  }

  function Dashboard() {
    const trending =
      [...issues]
        .sort(
          (a, b) =>
            (b.votes || 0) -
            (a.votes || 0)
        )
        .slice(0, 3);

    const activeEmergencies =
      emergencyAlerts.filter(
        (a) =>
          a.active &&
          (!a.expires_at ||
            new Date(
              a.expires_at
            ) > new Date())
      );

    return (
      <div className="page-content">
        {activeEmergencies.map(
          (a) => (
            <EmergencyBanner
              key={a.id}
              alert={a}
            />
          )
        )}

        <section className="hero">
          <div>
            <span className="eyebrow">
              YOUR CAMPUS • CONNECTED
            </span>

            <h1>
              {getGreeting()},
              <br />
              <em>
                {profile?.role ===
                "admin"
                  ? "Administrator."
                  : "there."}
              </em>
            </h1>

            <p>
              See what's happening
              around campus, raise
              issues, share ideas and
              stay informed.
            </p>

            <div className="hero-actions">
              <button
                className="primary hero-button"
                onClick={() =>
                  goTo("report")
                }
              >
                + Report an issue
              </button>

              <button
                className="ghost-button"
                onClick={() =>
                  goTo(
                    "suggestions"
                  )
                }
              >
                ✦ Share an idea
              </button>
            </div>
          </div>

          <div className="hero-orbit">
            <div className="orbit-circle circle-one" />
            <div className="orbit-circle circle-two" />
            <div className="orbit-center">
              C
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            number={totalIssues}
            label="Total reports"
            icon="◈"
            className="stat-dark"
          />

          <StatCard
            number={pendingIssues}
            label="Awaiting action"
            icon="◌"
          />

          <StatCard
            number={progressIssues}
            label="Being resolved"
            icon="◐"
          />

          <StatCard
            number={resolvedIssues}
            label="Resolved"
            icon="✓"
          />
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  CAMPUS PULSE
                </span>

                <h2>
                  Trending issues
                </h2>
              </div>

              <button
                onClick={() =>
                  goTo("issues")
                }
              >
                View all →
              </button>
            </div>

            {trending.length ? (
              <div className="compact-issues">
                {trending.map(
                  (issue, i) => (
                    <div
                      className="compact-issue"
                      key={issue.id}
                      onClick={() =>
                        setSelectedIssue(
                          issue
                        )
                      }
                    >
                      <div className="rank">
                        0{i + 1}
                      </div>

                      <div className="compact-content">
                        <div>
                          <h3>
                            {
                              issue.title
                            }
                          </h3>

                          <span>
                            {getCategory(
                              issue
                            )}
                          </span>
                        </div>

                        <div className="compact-votes">
                          ↑{" "}
                          {issue.votes ||
                            0}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                icon="◈"
                title="No reports yet"
                text="Be the first to report a campus issue."
              />
            )}
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  LATEST
                </span>

                <h2>
                  Campus notices
                </h2>
              </div>

              <button
                onClick={() =>
                  goTo(
                    "announcements"
                  )
                }
              >
                All →
              </button>
            </div>

            {announcements
              .slice(0, 3)
              .map((a) => (
                <div
                  className="notice-row"
                  key={a.id}
                >
                  <div className="notice-dot" />

                  <div>
                    <h3>
                      {a.title}
                    </h3>

                    <p>
                      {a.content}
                    </p>

                    <small>
                      {new Date(
                        a.created_at
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              ))}

            {!announcements.length && (
              <EmptyState
                icon="◉"
                title="All quiet"
                text="No new campus notices."
              />
            )}
          </section>
        </div>
      </div>
    );
  }

  function EmergencyBanner({
    alert,
  }) {
    return (
      <div
        className={`emergency-banner ${alert.severity.toLowerCase()}`}
      >
        <div className="emergency-banner-icon">
          🚨
        </div>

        <div>
          <span>
            {alert.severity} CAMPUS ALERT
          </span>

          <h2>
            {alert.title}
          </h2>

          <p>
            {alert.message}
          </p>

          {alert.expires_at && (
            <small>
              Until{" "}
              {new Date(
                alert.expires_at
              ).toLocaleString()}
            </small>
          )}
        </div>

        {acknowledgedAlerts.includes(
          alert.id
        ) ? (
          <b className="ack-badge">
            ✓ Acknowledged
          </b>
        ) : (
          <button
            className="primary"
            onClick={() =>
              acknowledgeEmergency(
                alert.id
              )
            }
          >
            Acknowledge
          </button>
        )}
      </div>
    );
  }

  function IssuesPage() {
    return (
      <div className="page-content">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              CAMPUS COMMUNITY
            </span>

            <h1>
              Reported issues
            </h1>

            <p>
              Every report helps make
              campus better.
            </p>
          </div>

          <button
            className="primary compact-button"
            onClick={() =>
              goTo("report")
            }
          >
            + Report
          </button>
        </div>

        <SearchBar
          search={search}
          setSearch={setSearch}
        />

        <div className="filter-row">
          {STATUS_OPTIONS.map(
            (s) => (
              <button
                key={s}
                className={
                  filter === s
                    ? "filter active"
                    : "filter"
                }
                onClick={() =>
                  setFilter(s)
                }
              >
                {s}
              </button>
            )
          )}
        </div>

        <div className="issue-grid">
          {filteredIssues.map(
            (i) => (
              <IssueCard
                issue={i}
                key={i.id}
              />
            )
          )}
        </div>

        {!filteredIssues.length && (
          <EmptyState
            icon="⌕"
            title="Nothing found"
            text="Try another search or filter."
          />
        )}
      </div>
    );
  }

  function ReportPage() {
    return (
      <div className="page-content narrow">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              MAKE A DIFFERENCE
            </span>

            <h1>
              Report an issue
            </h1>

            <p>
              Give your college the
              information it needs to
              fix the problem.
            </p>
          </div>
        </div>

        <form
          className="form-panel"
          onSubmit={submitIssue}
        >
          <div className="form-section">
            <span className="form-number">
              01
            </span>

            <div className="form-section-content">
              <h2>
                What's happening?
              </h2>

              <p>
                Describe the issue
                clearly.
              </p>

              <label>
                Issue title
              </label>

              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="e.g. Fan not working in E Block"
              />

              <label>
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Tell us what happened, where it happened and anything else that could help..."
              />
            </div>
          </div>

          <div className="form-section">
            <span className="form-number">
              02
            </span>

            <div className="form-section-content">
              <h2>
                Classify it
              </h2>

              <div className="two-col">
                <div>
                  <label>
                    Category
                  </label>

                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Choose category
                    </option>

                    {categories.map(
                      (c) => (
                        <option
                          key={c.id}
                          value={c.id}
                        >
                          {c.icon}{" "}
                          {c.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value
                      )
                    }
                  >
                    <option>
                      Low
                    </option>
                    <option>
                      Medium
                    </option>
                    <option>
                      High
                    </option>
                    <option>
                      Critical
                    </option>
                  </select>
                </div>
              </div>

              <label>
                Location
              </label>

              <input
                value={location}
                onChange={(e) =>
                  setLocation(
                    e.target.value
                  )
                }
                placeholder="e.g. E Block, 2nd Floor"
              />
            </div>
          </div>

          <div className="form-section">
            <span className="form-number">
              03
            </span>

            <div className="form-section-content">
              <h2>
                Add evidence
              </h2>

              <p>
                Images are checked by
                server-side moderation
                before publication.
              </p>

              <label className="upload-zone">
                <span className="upload-icon">
                  ↑
                </span>

                <strong>
                  {image
                    ? "Change image"
                    : "Upload a photo"}
                </strong>

                <small>
                  PNG, JPG up to 5 MB
                </small>

                <input
                  id="issue-image"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                />
              </label>

              {imagePreview && (
                <div className="large-image-preview">
                  <img
                    src={imagePreview}
                    alt="Preview"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(
                        null
                      );

                      document
                        .getElementById(
                          "issue-image"
                        )
                        ?.setAttribute(
                          "value",
                          ""
                        );
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <span className="form-number">
              04
            </span>

            <div className="form-section-content">
              <h2>
                Privacy
              </h2>

              <label className="toggle-row">
                <div>
                  <strong>
                    Submit anonymously
                  </strong>

                  <small>
                    Your name won't be
                    shown publicly.
                  </small>
                </div>

                <input
                  className="toggle"
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) =>
                    setAnonymous(
                      e.target.checked
                    )
                  }
                />
              </label>
            </div>
          </div>

          <div className="submit-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                goTo("dashboard")
              }
            >
              Cancel
            </button>

            <button
              className="primary submit-button"
              disabled={loading}
            >
              {loading
                ? "Checking & submitting..."
                : "Submit report →"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  function SuggestionsPage() {
    return (
      <div className="page-content">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              BUILD THE FUTURE
            </span>

            <h1>
              Student ideas
            </h1>

            <p>
              Great campuses are built
              by people who speak up.
            </p>
          </div>
        </div>

        <div className="suggestion-layout">
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  COMMUNITY VOTES
                </span>

                <h2>
                  Popular ideas
                </h2>
              </div>
            </div>

            {suggestions.map(
              (s) => (
                <div
                  className="suggestion-card"
                  key={s.id}
                >
                  <div className="suggestion-vote">
                    <button
                      className={
                        votedSuggestions.includes(
                          s.id
                        )
                          ? "suggestion-vote-button active"
                          : "suggestion-vote-button"
                      }
                      onClick={() =>
                        voteSuggestion(
                          s.id
                        )
                      }
                    >
                      ↑
                    </button>

                    <strong>
                      {s.votes || 0}
                    </strong>
                  </div>

                  <div className="suggestion-body">
                    <div className="suggestion-title-row">
                      <h3>
                        {s.title}
                      </h3>

                      <span
                        className={`suggestion-status ${String(
                          s.status ||
                            "Pending"
                        )
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "-"
                          )}`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <p>
                      {
                        s.description
                      }
                    </p>

                    <small>
                      {s.anonymous
                        ? "Anonymous"
                        : "Student"}{" "}
                      •{" "}
                      {new Date(
                        s.created_at
                      ).toLocaleDateString()}
                    </small>
                  </div>

                  {profile?.role ===
                    "admin" && (
                    <div className="idea-actions">
                      <select
                        value={
                          s.status
                        }
                        onChange={(e) =>
                          changeSuggestionStatus(
                            s.id,
                            e.target.value
                          )
                        }
                      >
                        <option>
                          Pending
                        </option>
                        <option>
                          Under Review
                        </option>
                        <option>
                          Accepted
                        </option>
                        <option>
                          Implemented
                        </option>
                        <option>
                          Rejected
                        </option>
                      </select>

                      <button
                        type="button"
                        className="danger-ghost"
                        onClick={() =>
                          deleteSuggestion(
                            s.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            {!suggestions.length && (
              <EmptyState
                icon="✦"
                title="No ideas yet"
                text="Be the first student to suggest something."
              />
            )}
          </section>

          <form
            className="panel suggestion-form"
            onSubmit={
              submitSuggestion
            }
          >
            <span className="eyebrow">
              YOUR IDEA
            </span>

            <h2>
              Make a suggestion
            </h2>

            <label>
              Title
            </label>

            <input
              value={suggestionTitle}
              onChange={(e) =>
                setSuggestionTitle(
                  e.target.value
                )
              }
              placeholder="What should the college improve?"
            />

            <label>
              Details
            </label>

            <textarea
              value={
                suggestionDescription
              }
              onChange={(e) =>
                setSuggestionDescription(
                  e.target.value
                )
              }
              placeholder="Explain your idea..."
            />

            <label className="toggle-row">
              <div>
                <strong>
                  Post anonymously
                </strong>

                <small>
                  Your identity won't
                  be displayed.
                </small>
              </div>

              <input
                className="toggle"
                type="checkbox"
                checked={
                  suggestionAnonymous
                }
                onChange={(e) =>
                  setSuggestionAnonymous(
                    e.target.checked
                  )
                }
              />
            </label>

            <button className="primary">
              Submit idea →
            </button>
          </form>
        </div>
      </div>
    );
  }

  function AnnouncementsPage() {
    return (
      <div className="page-content">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              OFFICIAL
            </span>

            <h1>
              Campus notices
            </h1>

            <p>
              Important information
              from your college.
            </p>
          </div>
        </div>

        <div className="notice-grid">
          <div className="notice-feed">
            {announcements.map(
              (a) => (
                <article
                  className="big-notice"
                  key={a.id}
                >
                  <div className="notice-date">
                    <strong>
                      {new Date(
                        a.created_at
                      ).getDate()}
                    </strong>

                    <span>
                      {new Date(
                        a.created_at
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",
                        }
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="eyebrow">
                      CAMPUS NOTICE
                    </span>

                    <h2>
                      {a.title}
                    </h2>

                    <p>
                      {a.content}
                    </p>

                    <small>
                      Published{" "}
                      {new Date(
                        a.created_at
                      ).toLocaleString()}
                    </small>
                  </div>

                  {profile?.role ===
                    "admin" && (
                    <button
                      className="icon-delete"
                      onClick={() =>
                        deleteAnnouncement(
                          a.id
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </article>
              )
            )}

            {!announcements.length && (
              <EmptyState
                icon="◉"
                title="No notices"
                text="There are no campus announcements right now."
              />
            )}
          </div>

          {profile?.role ===
            "admin" && (
            <form
              className="panel admin-create"
              onSubmit={
                postAnnouncement
              }
            >
              <span className="eyebrow">
                ADMIN
              </span>

              <h2>
                Publish notice
              </h2>

              <label>
                Title
              </label>

              <input
                value={
                  announcementTitle
                }
                onChange={(e) =>
                  setAnnouncementTitle(
                    e.target.value
                  )
                }
              />

              <label>
                Message
              </label>

              <textarea
                value={
                  announcementContent
                }
                onChange={(e) =>
                  setAnnouncementContent(
                    e.target.value
                  )
                }
              />

              <button className="primary">
                Publish →
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  function EventsPage() {
    return (
      <div className="page-content">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              CAMPUS LIFE
            </span>

            <h1>
              Events & activities
            </h1>

            <p>
              Don't miss what's
              happening around
              campus.
            </p>
          </div>
        </div>

        <div className="events-grid">
          {events.map((e) => (
            <article
              className="event-card"
              key={e.id}
            >
              <div className="event-date-box">
                <strong>
                  {new Date(
                    e.event_date
                  ).getDate()}
                </strong>

                <span>
                  {new Date(
                    e.event_date
                  ).toLocaleDateString(
                    "en-US",
                    {
                      month:
                        "short",
                    }
                  )}
                </span>
              </div>

              <div className="event-body">
                <span className="eyebrow">
                  UPCOMING
                </span>

                <h2>
                  {e.title}
                </h2>

                <p>
                  {e.description}
                </p>

                <div className="event-meta">
                  <span>
                    ◷{" "}
                    {new Date(
                      e.event_date
                    ).toLocaleString()}
                  </span>

                  {e.location && (
                    <span>
                      ⌖{" "}
                      {e.location}
                    </span>
                  )}
                </div>
              </div>

              {profile?.role ===
                "admin" && (
                <button
                  className="icon-delete"
                  onClick={() =>
                    deleteEvent(
                      e.id
                    )
                  }
                >
                  ×
                </button>
              )}
            </article>
          ))}

          {!events.length && (
            <EmptyState
              icon="◷"
              title="No events scheduled"
              text="New campus events will appear here."
            />
          )}
        </div>

        {profile?.role ===
          "admin" && (
          <form
            className="panel event-form"
            onSubmit={createEvent}
          >
            <span className="eyebrow">
              ADMIN
            </span>

            <h2>
              Create an event
            </h2>

            <div className="two-col">
              <div>
                <label>
                  Event title
                </label>

                <input
                  value={eventTitle}
                  onChange={(e) =>
                    setEventTitle(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Date & time
                </label>

                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) =>
                    setEventDate(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <label>
              Location
            </label>

            <input
              value={eventLocation}
              onChange={(e) =>
                setEventLocation(
                  e.target.value
                )
              }
            />

            <label>
              Description
            </label>

            <textarea
              value={eventDescription}
              onChange={(e) =>
                setEventDescription(
                  e.target.value
                )
              }
            />

            <button className="primary">
              Create event →
            </button>
          </form>
        )}
      </div>
    );
  }

  function EmergencyPage() {
    const active =
      emergencyAlerts.filter(
        (a) =>
          a.active &&
          (!a.expires_at ||
            new Date(
              a.expires_at
            ) > new Date())
      );

    const expired =
      emergencyAlerts.filter(
        (a) =>
          !a.active ||
          (a.expires_at &&
            new Date(
              a.expires_at
            ) <= new Date())
      );

    return (
      <div className="page-content emergency-page">
        <div className="page-intro system-intro emergency-intro">
          <div>
            <span className="eyebrow">
              CAMPUS SAFETY CHANNEL
            </span>

            <h1>
              Emergency Broadcast
            </h1>

            <p>
              This channel is
              reserved for incidents
              that require immediate
              student attention.
            </p>
          </div>

          <div className="live-indicator">
            <i />{" "}
            {active.length
              ? "LIVE CAMPUS ALERT"
              : "NO ACTIVE ALERT"}
          </div>
        </div>

        {active.length ? (
          <div className="emergency-stack">
            {active.map((a) => (
              <EmergencyBanner
                key={a.id}
                alert={a}
              />
            ))}
          </div>
        ) : (
          <section className="safety-clear">
            <div className="safety-icon">
              ✓
            </div>

            <div>
              <span className="eyebrow">
                CAMPUS STATUS
              </span>

              <h2>
                No active emergency
              </h2>

              <p>
                There are currently no
                active safety broadcasts.
                Check back here during
                an incident.
              </p>
            </div>
          </section>
        )}

        <section className="emergency-history panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                BROADCAST LOG
              </span>

              <h2>
                Previous alerts
              </h2>
            </div>

            <span className="count-pill">
              {emergencyAlerts.length}{" "}
              total
            </span>
          </div>

          {expired.length
            ? expired.map((a) => (
                <div
                  className="emergency-history-row"
                  key={a.id}
                >
                  <div
                    className={`severity-dot ${a.severity.toLowerCase()}`}
                  />

                  <div className="history-main">
                    <div>
                      <span
                        className={`severity-label ${a.severity.toLowerCase()}`}
                      >
                        {a.severity}
                      </span>

                      <h3>
                        {a.title}
                      </h3>
                    </div>

                    <p>
                      {a.message}
                    </p>

                    <small>
                      {new Date(
                        a.created_at
                      ).toLocaleString()}{" "}
                      {a.expires_at
                        ? `· ended ${new Date(
                            a.expires_at
                          ).toLocaleString()}`
                        : ""}
                    </small>
                  </div>

                  {profile?.role ===
                    "admin" && (
                    <div className="row-actions">
                      <button
                        onClick={() =>
                          toggleEmergency(
                            a.id,
                            true
                          )
                        }
                      >
                        Reactivate
                      </button>

                      <button
                        onClick={() =>
                          deleteEmergency(
                            a.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            : (
              <EmptyState
                icon="◌"
                title="No previous broadcasts"
                text="Emergency history will appear here after an alert is sent."
              />
            )}
        </section>

        {profile?.role ===
          "admin" && (
          <section className="admin-operation-panel">
            <div className="operation-copy">
              <span className="eyebrow">
                ADMIN CONTROL
              </span>

              <h2>
                Broadcast a safety alert
              </h2>

              <p>
                Use this only for urgent
                campus-wide information.
                Students see active
                broadcasts before normal
                campus content.
              </p>
            </div>

            <form
              onSubmit={createEmergency}
            >
              <div className="severity-selector">
                {[
                  "Emergency",
                  "Critical",
                  "Warning",
                ].map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={
                      emergencySeverity ===
                      v
                        ? `severity-choice selected ${v.toLowerCase()}`
                        : "severity-choice"
                    }
                    onClick={() =>
                      setEmergencySeverity(
                        v
                      )
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>

              <input
                value={
                  emergencyTitle
                }
                onChange={(e) =>
                  setEmergencyTitle(
                    e.target.value
                  )
                }
                placeholder="Alert headline"
              />

              <textarea
                value={
                  emergencyMessage
                }
                onChange={(e) =>
                  setEmergencyMessage(
                    e.target.value
                  )
                }
                placeholder="What happened? What should students do?"
              />

              <div className="two-col">
                <div>
                  <label>
                    Auto-expire
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      emergencyExpiry
                    }
                    onChange={(e) =>
                      setEmergencyExpiry(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-hint">
                  <strong>
                    Keep it actionable.
                  </strong>

                  <span>
                    Include location,
                    instructions and time
                    limits when relevant.
                  </span>
                </div>
              </div>

              <button className="primary">
                Broadcast now 🚨
              </button>
            </form>
          </section>
        )}
      </div>
    );
  }

  function PollsPage() {
    const active =
      polls.filter(
        (p) => !pollIsClosed(p)
      );

    const closed =
      polls.filter(
        (p) => pollIsClosed(p)
      );

    const totalVotes =
      Object.values(
        pollResults
      ).reduce(
        (sum, rows) =>
          sum +
          rows.reduce(
            (n, r) =>
              n +
              Number(
                r.vote_count || 0
              ),
            0
          ),
        0
      );

    const featured =
      active[0];

    const renderPoll = (
      p,
      isClosed = false
    ) => {
      const opts =
        pollOptions.filter(
          (o) =>
            String(o.poll_id) ===
            String(p.id)
        );

      const myVote =
        pollVotes.find(
          (v) =>
            String(v.poll_id) ===
            String(p.id)
        );

      const results =
        pollResults[p.id] || [];

      const votes =
        results.reduce(
          (n, r) =>
            n +
            Number(
              r.vote_count || 0
            ),
          0
        );

      const ended =
        isClosed ||
        pollIsClosed(p);

      return (
        <article
          className={`decision-card ${
            featured?.id === p.id
              ? "featured"
              : ""
          }`}
          key={p.id}
        >
          <div className="decision-top">
            <span
              className={`decision-status ${
                ended
                  ? "closed"
                  : "open"
              }`}
            >
              {ended
                ? "CLOSED"
                : "OPEN FOR VOTING"}
            </span>

            {p.ends_at && (
              <span className="decision-deadline">
                Ends{" "}
                {new Date(
                  p.ends_at
                ).toLocaleString()}
              </span>
            )}

            {profile?.role ===
              "admin" && (
              <button
                className="icon-delete"
                onClick={() =>
                  deletePoll(p.id)
                }
              >
                ×
              </button>
            )}
          </div>

          <h2>
            {p.title}
          </h2>

          {p.description && (
            <p className="decision-description">
              {p.description}
            </p>
          )}

          <div className="decision-meta">
            <span>
              ◉ {votes} vote
              {votes === 1
                ? ""
                : "s"}
            </span>

            <span>
              {myVote
                ? "✓ Your vote is locked"
                : "1 vote per student"}
            </span>
          </div>

          <div className="decision-options">
            {opts.map((o) => {
              const count =
                Number(
                  results.find(
                    (r) =>
                      String(
                        r.option_id
                      ) ===
                      String(o.id)
                  )?.vote_count ||
                    0
                );

              const pct = votes
                ? Math.round(
                    (count /
                      votes) *
                      100
                  )
                : 0;

              const selected =
                myVote &&
                String(
                  myVote.option_id
                ) ===
                  String(o.id);

              const disabled =
                Boolean(myVote) ||
                ended;

              return (
                <button
                  type="button"
                  key={o.id}
                  disabled={disabled}
                  className={`decision-option ${
                    selected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    votePoll(
                      p.id,
                      o.id
                    )
                  }
                >
                  <div className="option-line">
                    <span>
                      {
                        o.option_text
                      }
                    </span>

                    <b>
                      {disabled
                        ? `${pct}%`
                        : "Vote"}
                    </b>
                  </div>

                  {disabled && (
                    <div className="result-track">
                      <i
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {myVote && (
            <div className="voted-banner">
              ✓ Thanks — your response
              has been recorded. Results
              are shown above.
            </div>
          )}

          {profile?.role ===
            "admin" &&
            !ended && (
              <div className="decision-admin-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    closePoll(
                      p.id
                    )
                  }
                >
                  Close decision
                </button>
              </div>
            )}
        </article>
      );
    };

    return (
      <div className="page-content polls-page">
        <div className="page-intro system-intro">
          <div>
            <span className="eyebrow">
              STUDENT VOICE • ONE PERSON,
              ONE VOTE
            </span>

            <h1>
              College Decision Polls
            </h1>

            <p>
              Give students a direct say
              on practical campus
              decisions — events,
              facilities, schedules and
              student life.
            </p>
          </div>

          <div className="poll-stat">
            <strong>
              {active.length}
            </strong>

            <span>
              open decisions
            </span>

            <small>
              {totalVotes} votes
              recorded
            </small>
          </div>
        </div>

        {featured && (
          <section className="featured-decision">
            <div className="featured-label">
              FEATURED DECISION
            </div>

            {renderPoll(
              featured
            )}
          </section>
        )}

        {!featured && (
          <section className="safety-clear">
            <div className="safety-icon">
              ✓
            </div>

            <div>
              <span className="eyebrow">
                STUDENT VOICE
              </span>

              <h2>
                No open decisions
              </h2>

              <p>
                When the college opens a
                decision for voting, it
                will appear here.
              </p>
            </div>
          </section>
        )}

        {active.length >
          1 && (
          <section className="decision-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  OPEN NOW
                </span>

                <h2>
                  More decisions
                </h2>
              </div>
            </div>

            <div className="decision-grid">
              {active
                .slice(1)
                .map((p) =>
                  renderPoll(p)
                )}
            </div>
          </section>
        )}

        {closed.length >
          0 && (
          <section className="decision-section archive">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  ARCHIVE
                </span>

                <h2>
                  Past decisions
                </h2>
              </div>

              <span className="count-pill">
                {closed.length}
              </span>
            </div>

            <div className="decision-grid">
              {closed.map((p) =>
                renderPoll(
                  p,
                  true
                )
              )}
            </div>
          </section>
        )}

        {profile?.role ===
          "admin" && (
          <section className="admin-operation-panel poll-builder">
            <div className="operation-copy">
              <span className="eyebrow">
                ADMIN CONTROL
              </span>

              <h2>
                Create a campus decision
              </h2>

              <p>
                Use polls for decisions
                the student body should
                influence. Do not use this
                for issue reporting or
                suggestions.
              </p>
            </div>

            <form
              onSubmit={createPoll}
            >
              <input
                value={pollTitle}
                onChange={(e) =>
                  setPollTitle(
                    e.target.value
                  )
                }
                placeholder="Decision question"
              />

              <textarea
                value={
                  pollDescription
                }
                onChange={(e) =>
                  setPollDescription(
                    e.target.value
                  )
                }
                placeholder="Add context so students can make an informed choice."
              />

              <div className="two-col">
                <div>
                  <label>
                    Closing date
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      pollEndsAt
                    }
                    onChange={(e) =>
                      setPollEndsAt(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    New option
                  </label>

                  <div className="inline-form">
                    <input
                      value={
                        pollOptionText
                      }
                      onChange={(e) =>
                        setPollOptionText(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Saturday"
                    />

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        if (
                          pollOptionText.trim()
                        ) {
                          setPollOptionDrafts(
                            (o) => [
                              ...o,
                              pollOptionText.trim(),
                            ]
                          );

                          setPollOptionText(
                            ""
                          );
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="option-draft-list">
                {pollOptionDrafts.map(
                  (o, i) => (
                    <div
                      className="option-draft"
                      key={`${o}-${i}`}
                    >
                      <span>
                        {i + 1}
                      </span>

                      {o}

                      <button
                        type="button"
                        onClick={() =>
                          setPollOptionDrafts(
                            (x) =>
                              x.filter(
                                (_, j) =>
                                  j !== i
                              )
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>

              <button className="primary">
                Publish decision →
              </button>
            </form>
          </section>
        )}
      </div>
    );
  }

  function LostFoundPage() {
    const q =
      lfSearch
        .trim()
        .toLowerCase();

    const visible =
      lostFound.filter((x) => {
        const mine =
          x.user_id ===
          session.user.id;

        const approved =
          x.moderation_status ===
          "Approved";

        const allowed =
          profile?.role ===
            "admin" ||
          approved ||
          mine;

        const matchesFilter =
          lfFilter === "ALL" ||
          x.item_type ===
            lfFilter ||
          x.status?.toUpperCase() ===
            lfFilter;

        const text =
          `${x.title || ""} ${
            x.description || ""
          } ${
            x.location || ""
          }`.toLowerCase();

        return (
          allowed &&
          matchesFilter &&
          text.includes(q)
        );
      });

    const approved =
      lostFound.filter(
        (x) =>
          x.moderation_status ===
          "Approved"
      ).length;

    const pending =
      lostFound.filter(
        (x) =>
          x.moderation_status ===
          "Pending"
      ).length;

    return (
      <div className="page-content lostfound-page">
        <section className="lf-masthead">
          <div className="lf-mast-copy">
            <span className="eyebrow">
              CAMPUS RECOVERY NETWORK
            </span>

            <h1>
              Lost &{" "}
              <em>Found.</em>
            </h1>

            <p>
              A focused campus board
              for missing IDs, wallets,
              electronics, books and
              anything else that needs to
              find its way home.
            </p>

            <div className="lf-mast-actions">
              <button
                className="primary"
                onClick={() =>
                  document
                    .getElementById(
                      "lost-found-composer"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                      block: "start",
                    })
                }
              >
                ＋ Post an item
              </button>

              <span>
                <b>
                  {approved}
                </b>{" "}
                approved posts{" "}
                <i>·</i>{" "}
                <b>
                  {pending}
                </b>{" "}
                under review
              </span>
            </div>
          </div>

          <div
            className="lf-mast-visual"
            aria-hidden="true"
          >
            <div className="lf-orbit lf-orbit-one" />
            <div className="lf-orbit lf-orbit-two" />

            <div className="lf-mast-icon">
              ⌕
            </div>

            <span className="lf-float lf-float-one">
              FOUND
            </span>

            <span className="lf-float lf-float-two">
              LOST
            </span>
          </div>
        </section>

        <section className="lf-toolbar-modern">
          <div className="segmented">
            {[
              ["ALL", "All items"],
              ["LOST", "Lost"],
              ["FOUND", "Found"],
              [
                "RECOVERED",
                "Recovered",
              ],
            ].map(([v, l]) => (
              <button
                key={v}
                className={
                  lfFilter === v
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setLfFilter(v)
                }
              >
                {l}
              </button>
            ))}
          </div>

          <div className="lf-search-modern">
            <span>⌕</span>

            <input
              value={lfSearch}
              onChange={(e) =>
                setLfSearch(
                  e.target.value
                )
              }
              placeholder="Search items, locations or details"
            />

            {lfSearch && (
              <button
                type="button"
                onClick={() =>
                  setLfSearch("")
                }
              >
                ×
              </button>
            )}
          </div>
        </section>

        <section className="lf-results-head">
          <div>
            <span className="eyebrow">
              CAMPUS BOARD
            </span>

            <h2>
              {visible.length
                ? `${visible.length} ${
                    visible.length ===
                    1
                      ? "item"
                      : "items"
                  }`
                : "Nothing here yet"}
            </h2>
          </div>

          <span className="lf-review-note">
            Posts are reviewed before
            campus-wide publishing
          </span>
        </section>

        <div className="lostfound-grid modern-lf-grid">
          {visible.map((x) => (
            <article
              className="lf-card modern-lf-card"
              key={x.id}
            >
              <div className="lf-card-media">
                {x.image_url ? (
                  <img
                    src={x.image_url}
                    alt={x.title}
                  />
                ) : (
                  <div
                    className={`lf-placeholder ${x.item_type.toLowerCase()}`}
                  >
                    <span>
                      {x.item_type ===
                      "LOST"
                        ? "?"
                        : "✓"}
                    </span>

                    <small>
                      {x.item_type ===
                      "LOST"
                        ? "Lost item"
                        : "Found item"}
                    </small>
                  </div>
                )}

                <span
                  className={`lf-badge ${x.item_type.toLowerCase()}`}
                >
                  {x.item_type}
                </span>

                {x.moderation_status !==
                  "Approved" && (
                  <span
                    className={`lf-review-badge ${String(
                      x.moderation_status ||
                        ""
                    ).toLowerCase()}`}
                  >
                    {
                      x.moderation_status
                    }
                  </span>
                )}
              </div>

              <div className="lf-card-body">
                <div className="lf-card-top">
                  <span
                    className={`lf-status ${String(
                      x.status ||
                        "Open"
                    ).toLowerCase()}`}
                  >
                    {x.status}
                  </span>

                  {x.item_date && (
                    <span className="lf-date">
                      {new Date(
                        x.item_date
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h2>
                  {x.title}
                </h2>

                <p>
                  {x.description}
                </p>

                <div className="lf-details">
                  <span>
                    ⌖{" "}
                    <b>
                      {x.location ||
                        "Location not given"}
                    </b>
                  </span>
                </div>

                {x.user_id ===
                  session.user.id && (
                  <small className="your-post">
                    YOUR POST ·{" "}
                    {
                      x.moderation_status
                    }
                  </small>
                )}

                {profile?.role ===
                  "admin" && (
                  <div className="row-actions lf-admin-actions">
                    <select
                      value={
                        x.status
                      }
                      onChange={(e) =>
                        updateLostStatus(
                          x.id,
                          e.target.value
                        )
                      }
                    >
                      <option>
                        Open
                      </option>
                      <option>
                        Claimed
                      </option>
                      <option>
                        Recovered
                      </option>
                    </select>

                    {x.moderation_status !==
                      "Approved" && (
                      <button
                        onClick={() =>
                          moderateLostFound(
                            x.id,
                            "Approved"
                          )
                        }
                      >
                        Approve
                      </button>
                    )}

                    {x.moderation_status !==
                      "Rejected" && (
                      <button
                        onClick={() =>
                          moderateLostFound(
                            x.id,
                            "Rejected"
                          )
                        }
                      >
                        Reject
                      </button>
                    )}

                    <button
                      className="danger-ghost"
                      onClick={() =>
                        deleteLostFound(
                          x.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}

                {x.moderation_status ===
                  "Approved" &&
                  x.user_id ===
                    session.user.id && (
                    <select
                      className="owner-status"
                      value={
                        x.status
                      }
                      onChange={(e) =>
                        updateLostStatus(
                          x.id,
                          e.target.value
                        )
                      }
                    >
                      <option>
                        Open
                      </option>
                      <option>
                        Claimed
                      </option>
                      <option>
                        Recovered
                      </option>
                    </select>
                  )}
              </div>
            </article>
          ))}

          {!visible.length && (
            <div className="lf-empty-modern">
              <div>⌕</div>

              <h3>
                No matching items
              </h3>

              <p>
                Try another search or
                be the first person to
                post an item.
              </p>
            </div>
          )}
        </div>

        {profile?.role !==
          "admin" && (
          <section
            className="lf-composer-modern"
            id="lost-found-composer"
          >
            <div className="lf-composer-side">
              <span className="eyebrow">
                POST TO THE CAMPUS BOARD
              </span>

              <h2>
                Help an item
                <br />
                <em>
                  find its owner.
                </em>
              </h2>

              <p>
                Whether you've lost
                something or found
                something, give the campus
                enough detail to recognise
                it.
              </p>

              <div className="lf-process">
                <div>
                  <b>01</b>
                  <span>
                    Describe it clearly
                  </span>
                </div>

                <div>
                  <b>02</b>
                  <span>
                    Add where & when
                  </span>
                </div>

                <div>
                  <b>03</b>
                  <span>
                    Post for review
                  </span>
                </div>
              </div>
            </div>

            <form
              className="lf-form-modern"
              onSubmit={
                createLostFound
              }
            >
              <div className="type-toggle-modern">
                {[
                  [
                    "LOST",
                    "I lost something",
                    "↗",
                  ],
                  [
                    "FOUND",
                    "I found something",
                    "✓",
                  ],
                ].map(
                  ([v, t, icon]) => (
                    <button
                      type="button"
                      key={v}
                      className={
                        lfType === v
                          ? `selected ${v.toLowerCase()}`
                          : ""
                      }
                      onClick={() =>
                        setLfType(v)
                      }
                    >
                      <span>
                        {icon}
                      </span>

                      <div>
                        <strong>
                          {t}
                        </strong>

                        <small>
                          {v ===
                          "LOST"
                            ? "Help me recover it"
                            : "Help me find the owner"}
                        </small>
                      </div>
                    </button>
                  )
                )}
              </div>

              <div className="lf-form-grid-modern">
                <label>
                  <span>
                    Item name
                  </span>

                  <input
                    required
                    value={
                      lfTitle
                    }
                    onChange={(e) =>
                      setLfTitle(
                        e.target.value
                      )
                    }
                    placeholder="Black wallet, ID card, AirPods case…"
                  />
                </label>

                <label>
                  <span>
                    Where?
                  </span>

                  <input
                    value={
                      lfLocation
                    }
                    onChange={(e) =>
                      setLfLocation(
                        e.target.value
                      )
                    }
                    placeholder="Library, E Block, canteen…"
                  />
                </label>

                <label className="wide">
                  <span>
                    Description
                  </span>

                  <textarea
                    required
                    value={
                      lfDescription
                    }
                    onChange={(e) =>
                      setLfDescription(
                        e.target.value
                      )
                    }
                    placeholder="Colour, brand, marks, contents, identifying details…"
                  />
                </label>

                <label>
                  <span>
                    When?
                  </span>

                  <input
                    type="datetime-local"
                    value={lfDate}
                    onChange={(e) =>
                      setLfDate(
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Photo{" "}
                    <i>
                      optional
                    </i>
                  </span>

                  <div className="lf-upload-modern">
                    <input
                      id="lost-found-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const f =
                          e.target
                            .files?.[0] ||
                          null;

                        if (
                          f &&
                          !f.type.startsWith(
                            "image/"
                          )
                        ) {
                          e.target.value =
                            "";

                          setLfImage(
                            null
                          );

                          return setMessage(
                            "Please choose an image file."
                          );
                        }

                        if (
                          f &&
                          f.size >
                            8 *
                              1024 *
                              1024
                        ) {
                          e.target.value =
                            "";

                          setLfImage(
                            null
                          );

                          return setMessage(
                            "Photo must be 8 MB or smaller."
                          );
                        }

                        setLfImage(f);
                        setMessage("");
                      }}
                    />

                    <div className="upload-plus">
                      ＋
                    </div>

                    <div>
                      <b>
                        {lfImage
                          ? lfImage.name
                          : "Add a clear photo"}
                      </b>

                      <small>
                        {lfImage
                          ? `${Math.round(
                              lfImage.size /
                                1024
                            )} KB · ready to post`
                          : "JPG, PNG, WEBP · max 8 MB"}
                      </small>
                    </div>
                  </div>
                </label>
              </div>

              <div className="lf-submit-row-modern">
                <div>
                  <b>
                    Admin review
                  </b>

                  <span>
                    Every new post
                    starts as Pending.
                  </span>
                </div>

                <button
                  type="submit"
                  className="primary lf-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Posting…"
                    : "Post item →"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    );
  }

  function NotificationsPage() {
    async function markRead(id) {
      await supabase
        .from("notifications")
        .update({
          read: true,
        })
        .eq("id", id)
        .eq(
          "user_id",
          session.user.id
        );

      loadNotifications();
    }

    return (
      <div className="page-content narrow">
        <div className="page-intro">
          <div>
            <span className="eyebrow">
              STAY UPDATED
            </span>

            <h1>
              Notifications
            </h1>

            <p>
              Important updates about
              your campus activity.
            </p>
          </div>
        </div>

        <div className="notification-list">
          {notifications.map(
            (n) => (
              <div
                className={
                  n.read
                    ? "notification-item"
                    : "notification-item unread"
                }
                key={n.id}
                onClick={() =>
                  markRead(n.id)
                }
              >
                <div className="notification-icon">
                  ♢
                </div>

                <div>
                  <h3>
                    {n.title}
                  </h3>

                  <p>
                    {n.message}
                  </p>

                  <small>
                    {new Date(
                      n.created_at
                    ).toLocaleString()}
                  </small>
                </div>

                {!n.read && (
                  <span className="unread-dot" />
                )}
              </div>
            )
          )}

          {!notifications.length && (
            <EmptyState
              icon="♢"
              title="You're all caught up"
              text="New notifications will appear here."
            />
          )}
        </div>
      </div>
    );
  }

  function ProfilePage() {
    return (
      <div className="page-content narrow">
        <div className="profile-hero">
          <div className="profile-big-avatar">
            {(
              session.user.email?.[0] ||
              "U"
            ).toUpperCase()}
          </div>

          <span className="eyebrow">
            COLLEGECONNECT MEMBER
          </span>

          <h1>
            {profile?.role ===
            "admin"
              ? "Campus Administrator"
              : "Student Account"}
          </h1>

          <p>
            {session.user.email}
          </p>

          {profile?.role ===
            "admin" && (
            <span className="role-pill">
              ◆ ADMIN
            </span>
          )}
        </div>

        <div className="profile-stats">
          <div>
            <strong>
              {
                issues.filter(
                  (x) =>
                    x.user_id ===
                    session.user.id
                ).length
              }
            </strong>

            <span>
              Reports
            </span>
          </div>

          <div>
            <strong>
              {
                suggestions.filter(
                  (x) =>
                    x.user_id ===
                    session.user.id
                ).length
              }
            </strong>

            <span>
              Ideas
            </span>
          </div>

          <div>
            <strong>
              {votedIssues.length}
            </strong>

            <span>
              Issues supported
            </span>
          </div>

          <div>
            <strong>
              {
                lostFound.filter(
                  (x) =>
                    x.user_id ===
                    session.user.id
                ).length
              }
            </strong>

            <span>
              Lost & Found posts
            </span>
          </div>
        </div>

        <button
          className="logout-large"
          onClick={logout}
        >
          Log out
        </button>
      </div>
    );
  }

  function AdminPage() {
    const high =
      issues.filter(
        (x) =>
          x.priority === "High" ||
          x.priority ===
            "Critical"
      );

    return (
      <div className="page-content">
        <div className="admin-hero">
          <div>
            <span className="eyebrow">
              ADMINISTRATION
            </span>

            <h1>
              Command Center
            </h1>

            <p>
              Monitor and manage the
              campus in one place.
            </p>
          </div>

          <div className="admin-live">
            <span />
            LIVE
          </div>
        </div>

        <section className="stats-grid admin-stats">
          <StatCard
            number={totalIssues}
            label="All reports"
            icon="◈"
            className="stat-dark"
          />

          <StatCard
            number={pendingIssues}
            label="Needs attention"
            icon="!"
          />

          <StatCard
            number={high.length}
            label="High priority"
            icon="⚡"
          />

          <StatCard
            number={
              lostFound.filter(
                (x) =>
                  x.moderation_status ===
                  "Pending"
              ).length
            }
            label="Items to review"
            icon="🔎"
          />
        </section>

        <div className="admin-dashboard-grid">
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  ACTION REQUIRED
                </span>

                <h2>
                  Priority reports
                </h2>
              </div>

              <button
                onClick={() =>
                  goTo("issues")
                }
              >
                Manage →
              </button>
            </div>

            {high
              .slice(0, 6)
              .map((i) => (
                <div
                  className="admin-issue-row"
                  key={i.id}
                >
                  <div>
                    <span
                      className={`priority ${priorityClass(
                        i.priority
                      )}`}
                    >
                      {i.priority}
                    </span>

                    <h3>
                      {i.title}
                    </h3>

                    <small>
                      {i.location ||
                        "No location"}
                    </small>
                  </div>

                  <select
                    value={i.status}
                    onChange={(e) =>
                      changeStatus(
                        i.id,
                        e.target.value
                      )
                    }
                  >
                    <option>
                      Pending
                    </option>
                    <option>
                      In Progress
                    </option>
                    <option>
                      Resolved
                    </option>
                  </select>
                </div>
              ))}

            {!high.length && (
              <EmptyState
                icon="✓"
                title="Nothing urgent"
                text="There are no high-priority reports."
              />
            )}
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  SYSTEMS
                </span>

                <h2>
                  Campus operations
                </h2>
              </div>
            </div>

            <div className="admin-system-links">
              <button
                onClick={() =>
                  goTo("emergency")
                }
              >
                🚨 Emergency Broadcast
              </button>

              <button
                onClick={() =>
                  goTo("polls")
                }
              >
                🗳️ Decision Polls
              </button>

              <button
                onClick={() =>
                  goTo("lostfound")
                }
              >
                🔎 Lost & Found
              </button>

              <button
                onClick={() =>
                  goTo("lostfound")
                }
              >
                🔎 Review Lost & Found
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function IssueModal() {
    if (!selectedIssue)
      return null;

    const i =
      selectedIssue;

    return (
      <div
        className="modal-backdrop"
        onClick={() =>
          setSelectedIssue(
            null
          )
        }
      >
        <div
          className="issue-modal"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            className="modal-close"
            onClick={() =>
              setSelectedIssue(
                null
              )
            }
          >
            ×
          </button>

          <div className="modal-header">
            <div className="category-chip">
              {getCategory(i)}
            </div>

            <span
              className={`priority ${priorityClass(
                i.priority
              )}`}
            >
              {i.priority ||
                "Medium"}
            </span>
          </div>

          <h1>
            {i.title}
          </h1>

          <span
            className={`status ${i.status
              .toLowerCase()
              .replace(
                " ",
                "-"
              )}`}
          >
            {i.status}
          </span>

          <p className="modal-description">
            {i.description}
          </p>

          {i.image_url && (
            <img
              className="modal-image"
              src={i.image_url}
              alt={i.title}
            />
          )}

          <div className="modal-details">
            {i.location && (
              <div>
                <small>
                  LOCATION
                </small>

                <strong>
                  ⌖ {i.location}
                </strong>
              </div>
            )}

            <div>
              <small>
                SUPPORT
              </small>

              <strong>
                ↑{" "}
                {i.votes || 0}{" "}
                students
              </strong>
            </div>

            <div>
              <small>
                REPORTED
              </small>

              <strong>
                {new Date(
                  i.created_at
                ).toLocaleDateString()}
              </strong>
            </div>
          </div>

          <button
            className="primary modal-vote"
            onClick={() =>
              vote(i.id)
            }
          >
            {votedIssues.includes(
              i.id
            )
              ? "✓ You support this issue"
              : "↑ Support this issue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-shell">
        <TopBar />

        {message && (
          <div className="global-message">
            <span>
              {message}
            </span>

            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        <main>
          {page ===
            "dashboard" && (
            <StableView
              render={Dashboard}
            />
          )}

          {page === "issues" && (
            <StableView
              render={IssuesPage}
            />
          )}

          {page === "report" && (
            <StableView
              render={ReportPage}
            />
          )}

          {page ===
            "suggestions" && (
            <StableView
              render={
                SuggestionsPage
              }
            />
          )}

          {page === "events" && (
            <StableView
              render={EventsPage}
            />
          )}

          {page ===
            "announcements" && (
            <StableView
              render={
                AnnouncementsPage
              }
            />
          )}

          {page === "emergency" && (
            <StableView
              render={EmergencyPage}
            />
          )}

          {page === "polls" && (
            <StableView
              render={PollsPage}
            />
          )}

          {page === "lostfound" && (
            <StableView
              render={
                LostFoundPage
              }
            />
          )}

          {page ===
            "notifications" && (
            <StableView
              render={
                NotificationsPage
              }
            />
          )}

          {page === "profile" && (
            <StableView
              render={ProfilePage}
            />
          )}

          {page === "admin" &&
            profile?.role ===
              "admin" && (
              <StableView
                render={AdminPage}
              />
            )}
        </main>
      </div>

      <MobileNav />

      <IssueModal />
    </div>
  );
}

export default App;