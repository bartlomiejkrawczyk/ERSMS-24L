import "../scss/styles.scss";
import * as login from "./login";

const params = new URLSearchParams(window.location.search);
const threadId = params.get("threadId") ?? "";

let isAdmin = false;
let isOwner = false;
let isModerator = false;

async function loadThreadOwnerData() {
    const response = await fetch(`/threads/api/v1/threads/${encodeURIComponent(threadId)}`);
  if (!response.ok) {
    console.error(`Failed to fetch thread details ${threadId}: ${response.status} ${response.statusText}`);
    return;
  }

  const data = await response.json();
  isOwner = (await login.getUserDetails())?.accountId === data.accountId;
  (document.getElementById("thread_name") as HTMLSpanElement).innerText = data.title;
  (document.getElementById("thread_author") as HTMLSpanElement).innerText = data.username;
}

async function loadModeratorData() {
  isAdmin = login.isAdmin();
  isModerator = isOwner || isAdmin || await login.isModeratorUnder(threadId);
}

async function refreshBannedUsersList() {
  const bannedUsers = await listBannedUsers();

  const elements: HTMLLIElement[] = bannedUsers.map(([username, bannedUserId]) => {
    // <li class="list-group-item d-flex justify-content-between align-items-center">
    //  <span>username</span>
    //  <!-- Button only if isModerator -->
    //  <button role="button" class="btn btn-sm btn-danger">-</button>
    // </li>
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")

    const span = document.createElement("span");
    span.innerText = username;
    li.append(span);

    if (isModerator) {
      const button = document.createElement("button");
      button.role = "button";
      button.classList.add("btn", "btn-sm", "btn-danger");
      button.innerText = "-";
      button.onclick = () => unBanUser(bannedUserId);
      li.append(button);
    }

    return li;
  });

  if (isModerator) {
    // <li id="ban_user_username" class="list-group-item d-flex justify-content-between align-items-center">
    //  <input type="text" class="form-control" placeholder="Username" />
    //  <button type="button" class="btn btn-sm btn-success ms-2">+</button>
    // </li>
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")

    const input = document.createElement("input");
    input.id = "ban_user_username";
    input.type = "text";
    input.placeholder = "Username";
    input.classList.add("form-control");
    li.append(input)

    const button = document.createElement("button");
    button.role = "button";
    button.classList.add("btn", "btn-sm", "btn-success", "ms-2");
    button.innerText = "+";
    button.onclick = banUser;
    li.append(button);

    elements.push(li);
  }

  (document.getElementById("banned_users_list") as HTMLUListElement).replaceChildren(...elements);
}

async function listBannedUsers(): Promise<[string, string][]> {
  const response = await fetch(
    // TODO: Change to sort=username,desc
    `/threads/api/v1/bannedUsers?threadId=${encodeURIComponent(threadId)}&page=0&size=2147483647&sort=accountId,desc`,
    {headers: {"Authorization": login.getAuthorizationHeader()}},
  );
  if (!response.ok) {
    throw `Failed to list banned users for ${threadId}: ${response.status} ${response.statusText}`;
  }

  return (await response.json()).content.map((o: any) => [o.username ?? o.accountId, o.bannedUserId]);
}

async function unBanUser(bannedUserId: string) {
  const response = await fetch(
    "/threads/api/v1/bannedUsers",
    {
      method: "DELETE",
      headers: {
        "Authorization": login.getAuthorizationHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bannedUserId }),
    },
  );
  if (!response.ok && response.status !== 404) {
    throw `Failed to un-ban ${bannedUserId}: ${response.status} ${response.statusText}`;
  }

  await refreshBannedUsersList();
}

async function banUser(): Promise<void> {
  const input = document.getElementById("ban_user_username") as HTMLInputElement | null;
  if (input === null) return;

  const username = input.value;
  if (username === "") return;

  const accountId = await login.findAccountIdByUsername(username);
  if (accountId === null) {
    console.warn("No such user:", username);
    return;
  }

  const response = await fetch(
    "/threads/api/v1/bannedUsers",
    {
      method: "POST",
      headers: {
        "Authorization": login.getAuthorizationHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ threadId, subjectAccountId: accountId }),
    },
  );
  if (!response.ok) {
    throw `Failed to ban user ${accountId}: ${response.status} ${response.statusText}`;
  }

  await refreshBannedUsersList();
}

async function refreshModeratorsList() {
  const moderators = await listModerators();

  const elements: HTMLLIElement[] = moderators.map(([username, moderatorId]) => {
    // <li class="list-group-item d-flex justify-content-between align-items-center">
    //  <span>username</span>
    //  <!-- Button only if isModerator -->
    //  <button role="button" class="btn btn-sm btn-danger">-</button>
    // </li>
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")

    const span = document.createElement("span");
    span.innerText = username;
    li.append(span);

    if (isOwner || isAdmin) {
      const button = document.createElement("button");
      button.role = "button";
      button.classList.add("btn", "btn-sm", "btn-danger");
      button.innerText = "-";
      button.onclick = () => removeModerator(moderatorId);
      li.append(button);
    }

    return li;
  });

  if (isOwner || isAdmin) {
    // <li id="add_moderator_username" class="list-group-item d-flex justify-content-between align-items-center">
    //  <input type="text" class="form-control" placeholder="Username" />
    //  <button type="button" class="btn btn-sm btn-success ms-2">+</button>
    // </li>
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")

    const input = document.createElement("input");
    input.id = "add_moderator_username";
    input.type = "text";
    input.placeholder = "Username";
    input.classList.add("form-control");
    li.append(input)

    const button = document.createElement("button");
    button.role = "button";
    button.classList.add("btn", "btn-sm", "btn-success", "ms-2");
    button.innerText = "+";
    button.onclick = addModerator;
    li.append(button);

    elements.push(li);
  }

  (document.getElementById("moderators_list") as HTMLUListElement).replaceChildren(...elements);
}

async function listModerators(): Promise<[string, string][]> {
  const response = await fetch(
    // TODO: Change to sort=username,desc
    `/threads/api/v1/moderators?threadId=${encodeURIComponent(threadId)}&page=0&size=2147483647&sort=accountId,desc`,
    {headers: {"Authorization": login.getAuthorizationHeader()}},
  );
  if (!response.ok) {
    throw `Failed to list moderators for ${threadId}: ${response.status} ${response.statusText}`;
  }

  return (await response.json()).content.map((o: any) => [o.username ?? o.accountId, o.moderatorId]);
}

async function removeModerator(moderatorId: string): Promise<void> {
  const response = await fetch(
    "/threads/api/v1/moderators",
    {
      method: "DELETE",
      headers: {
        "Authorization": login.getAuthorizationHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moderatorId }),
    },
  );
  if (!response.ok && response.status !== 404) {
    throw `Failed to remove moderator ${moderatorId}: ${response.status} ${response.statusText}`;
  }

  await refreshModeratorsList();
}

async function addModerator(): Promise<void> {
  const input = document.getElementById("add_moderator_username") as HTMLInputElement | null;
  if (input === null) return;

  const username = input.value;
  if (username === "") return;

  const accountId = await login.findAccountIdByUsername(username);
  if (accountId === null) {
    console.warn("No such user:", username);
    return;
  }

  const response = await fetch(
    "/threads/api/v1/moderators",
    {
      method: "POST",
      headers: {
        "Authorization": login.getAuthorizationHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ threadId, subjectAccountId: accountId }),
    },
  );
  if (!response.ok) {
    throw `Failed to add moderator ${accountId}: ${response.status} ${response.statusText}`;
  }

  await refreshModeratorsList();
}

async function init() {
  await login.initLoginManager(true);
  await loadThreadOwnerData();
  await loadModeratorData();
  await Promise.all([refreshBannedUsersList(), refreshModeratorsList()])
}

init();
