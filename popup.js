let currentStatTab = -1;
let currentPosition = {
    status : null,
}
let currentCategory = "xrank";
let allPlayers = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    document.getElementById("title").textContent = message.title;
});

function requestPlayerData() {
	// Query the active tab to send the message to the content script
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTab = tabs[0];

		// Send a message to the content script
		chrome.tabs.sendMessage(
			activeTab.id,
			{ request: "getPlayerData" },
			(response) => {
				// Check if there was an error in the response
				if (chrome.runtime.lastError) {
					console.error("Message failed:", chrome.runtime.lastError.message);
				} else {
					// Log and display the received players
					console.log("Response from content script:", response);
					if (response?.players) {
						renderPlayerData(response.players.filter((player) => !player.drafted));
                        allPlayers = response.players;
					}
				}
			},
		);
	});
}

function requestDraftData() {
    // Query the active tab to send the message to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        // Send a message to the content script
        chrome.tabs.sendMessage(
            activeTab.id,
            { request: "getDraftData" },
            (response) => {
                // Check if there was an error in the response
                if (chrome.runtime.lastError) {
                    console.error("Message failed:", chrome.runtime.lastError.message);
                } else {
                    // Log and display the received players
                    console.log("Response from content script:", response);
                    if (response?.draftPicks) {
                        renderDraftData(response.draftPicks);
                    }
                }
            },
        );
    });
}

function renderPlayerData(players) {
	displayPlayers(players);
	displayStats(players);
}

function renderDraftData(draftPicks) {
    const draftDisplayElement = document.getElementById("draft-display");

    draftDisplayElement.innerHTML = ""; // Clear previous stats

    draftDisplayElement.appendChild(document.createElement("h3")).textContent =
        "Draft Picks";
    
    // Create a tab for each team
    const tabs = document.createElement("div");
    tabs.className = "sort-buttons";
    draftDisplayElement.appendChild(tabs); // Fixed to use the correct element

    const draftContainer = document.createElement("div");
    draftContainer.className = "draft";
    draftDisplayElement.appendChild(draftContainer); // Fixed to use the correct element

    // Find the team names
    const teams = draftPicks.map((pick) => pick.team);
    const uniqueTeams = [...new Set(teams)];

    // Function to render the draft picks for a team
    function renderPicks(team) {
        draftContainer.innerHTML = ""; // Clear previous picks

        // Create a list of picks for the team
        for (const pick of draftPicks.filter((pick) => pick.team === team)) {
            const pickElement = document.createElement("div");
            pickElement.className = "pick";
            pickElement.textContent = `${pick.pick}: ${pick.player} (${pick.playerId})`;
            draftContainer.appendChild(pickElement);
        }

        draftContainer.appendChild(document.createElement("hr"));

        // Provide team average stats for 3ptm, pts, reb, ast, st, blk
        const teamPlayers = allPlayers.filter((player) => draftPicks.some((pick) => pick.playerId === player.id && pick.team === team));
        const teamStats = {
            threepts: teamPlayers.reduce((acc, player) => acc + +player.threepts, 0),
            pts: teamPlayers.reduce((acc, player) => acc + +player.pts, 0),
            reb: teamPlayers.reduce((acc, player) => acc + +player.reb, 0),
            ast: teamPlayers.reduce((acc, player) => acc + +player.ast, 0),
            st: teamPlayers.reduce((acc, player) => acc + +player.st, 0),
            blk: teamPlayers.reduce((acc, player) => acc + +player.blk, 0),
        };
        const teamStatsElement = document.createElement("div");
        teamStatsElement.className = "team-stats";
        console.log(draftPicks);
        console.log(allPlayers);
        teamStatsElement.appendChild(document.createElement("div")).textContent = `3ptm: ${teamStats.threepts}`;
        teamStatsElement.appendChild(document.createElement("div")).textContent = `pts: ${teamStats.pts}`;
        teamStatsElement.appendChild(document.createElement("div")).textContent = `reb: ${teamStats.reb}`;
        teamStatsElement.appendChild(document.createElement("div")).textContent = `ast: ${teamStats.ast}`;
        teamStatsElement.appendChild(document.createElement("div")).textContent = `st: ${teamStats.st}`;
        teamStatsElement.appendChild(document.createElement("div")).textContent = `blk: ${teamStats.blk}`;
        draftContainer.appendChild(teamStatsElement);
    }

    // Create a tab for each team
    for (const team of uniqueTeams) {
        const tab = document.createElement("button");
        tab.className = "draft-tab";
        tab.textContent = team;

        // When a tab is clicked, show the picks for that team
        tab.onclick = () => {
            tab.classList.toggle("selected");
            // biome-ignore lint/complexity/noForEach: <explanation>
            tabs.querySelectorAll(".draft-tab").forEach((otherTab) => {
                if (otherTab !== tab) {
                    otherTab.classList.remove("selected");
                }
            });
            if (tab.classList.contains("selected")) {
                renderPicks(team);
            } else {
                draftContainer.innerHTML = ""; // Clear previous picks
            }
        };
        tabs.appendChild(tab);
    }

    // Display the picks for the first team
    renderPicks(uniqueTeams[0]);


}

// Function to display stats
function displayStats(players) {
	const statsDisplayElement = document.getElementById("stats-display");

	statsDisplayElement.innerHTML = ""; // Clear previous stats

	statsDisplayElement.appendChild(document.createElement("h3")).textContent =
		"Player Stats";
	// Create tabs for each position
	const tabs = document.createElement("div");
	tabs.className = "tabs";
	statsDisplayElement.appendChild(tabs); // Fixed to use the correct element

	const statsContainer = document.createElement("div");
	statsContainer.className = "stats";
	statsDisplayElement.appendChild(statsContainer); // Fixed to use the correct element

	// Function to compute the number of players in each position for the next N players
	const nextn = (n) =>
		players
			.slice(0, n)
			.flatMap((player) => player.positions)
			.reduce((acc, position) => {
				acc[position] = (acc[position] || 0) + 1;
				return acc;
			}, {});

	// Function to render the stats in the stats container
	function renderStats(stats) {
		statsContainer.innerHTML = ""; // Clear previous stats

		// Create a list of positions and their counts
		for (const [position, count] of Object.entries(stats)) {
			const statElement = document.createElement("div");
			statElement.className = "stat";
			statElement.textContent = `${position}: ${count}`;
			statElement.addEventListener("mouseover", () => {
                if (currentPosition.status !== "selected") {
                    currentPosition = {
                        status: "hovered",
                        position: position,
                    };
                }
				displayPlayers(players);
			});
			statElement.addEventListener("mouseout", () => {
                if (currentPosition.status === "hovered") {
                    currentPosition = {
                        status: null,
                    };
                }
				displayPlayers(players);
			});

            statElement.addEventListener("click", () => {
                if (currentPosition.status === "selected" && currentPosition.position === position) {
                    currentPosition = {
                        status: null,
                    };
                    statElement.classList.toggle("selected");
                } else {
                    currentPosition = {
                        status: "selected",
                        position: position,
                    };
                    statElement.classList.toggle("selected");

                    document.querySelectorAll(".stat").forEach((otherStat) => {
                        if (otherStat !== statElement) {
                            otherStat.classList.remove("selected");
                        }
                    });
                }
                displayPlayers(players);
            });
			statsContainer.appendChild(statElement);
		}
	}

	// Create a tab for each of the next 10, 25, 50, 100 players
	for (const n of [10, 25, 50, players.length > 100 ? 100 : players.length]) {
		const tab = document.createElement("div");
		tab.className = "tab";
		tab.textContent = `${n}`;

		// Compute stats for the next n players
		const stats = nextn(n);

		// When a tab is clicked, show the stats for that group
		tab.onclick = () => {
			tab.classList.toggle("selected");
			// biome-ignore lint/complexity/noForEach: <explanation>
			tabs.querySelectorAll(".tab").forEach((otherTab) => {
				if (otherTab !== tab) {
					otherTab.classList.remove("selected");
				}
			});
            if (tab.classList.contains("selected")) {
                renderStats(stats);
                currentStatTab = n;
            } else {
                statsContainer.innerHTML = ""; // Clear previous stats
                currentStatTab = 0;
            }
		};
		tabs.appendChild(tab);
	}
}

// Function to display players (same as before)
function displayPlayers(players) {
    // allPlayers = players;
	const playerListDiv = document.getElementById("playerList");
	playerListDiv.innerHTML = ""; // Clear previous list
    // Sorting buttons
    const sortCategories = ["xrank", "rank", "adp", "threepts", "pts", "reb", "ast", "st", "blk"];
    const sortButtons = document.createElement("div");
    sortButtons.className = "sort-buttons";
    playerListDiv.appendChild(sortButtons);
    for (const category of sortCategories) {
        const button = document.createElement("button");
        button.className = "sort-button";
        button.textContent = category;
        if (currentCategory === category) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
        button.addEventListener("click", () => {
            if (category === "xrank" || category === "rank" || category === "adp" || category === "to") {
                players.sort((a, b) => a[category] - b[category]);
            } else {
                players.sort((a, b) => b[category] - a[category]);
            }
            currentCategory = category;
            displayPlayers(players);
        });
        sortButtons.appendChild(button);
    }
	for (const [index, player] of players.entries()) {
        if ([10, 25, 50, 100].includes(index)) {
            const rulerWithNumber = document.createElement("hr");
            rulerWithNumber.style.setProperty("--ruler-number", `"${index}"`);
            playerListDiv.appendChild(rulerWithNumber);
        }
        console.log(currentPosition);
        if (currentPosition.status && !player.positions.includes(currentPosition.position)) {
            continue;
        }
		const playerDiv = document.createElement("div");
		playerDiv.className = "player";
		playerDiv.textContent = `${player.name} - ${player.positions.join(", ")}`;
		playerListDiv.appendChild(playerDiv);
	}
}

// Call the requestPlayerData function when the popup opens
document.addEventListener("DOMContentLoaded", requestPlayerData);
document.addEventListener("DOMContentLoaded", requestDraftData);
