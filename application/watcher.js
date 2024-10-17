

console.log("Content script loaded!");

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message from popup:", message);
  if (message.request === "getPlayerData") {
    console.log("Received request for player data");
    // Get the player elements
    console.log("Querying .ys-player.Ta-end");
    const playerElements = document.querySelectorAll('.ys-player.Ta-end'); // Adjust this selector as necessary
    const playerNames = Array.from(playerElements).map(player => {
      return {
        id: player.getAttribute('data-id'),
        xrank: player.children[0].innerText,
        rank: player.children[1].innerText,
        adp: player.children[2].innerText,
        name: player.children[3].children[2].innerText,
        team: player.children[3].children[3].children[0].innerText,
        positions: player.children[3].children[3].children[1].innerText.split(','),
        gp: player.children[4].innerText,
        fgpct: player.children[5].innerText,
        ftpct: player.children[6].innerText,
        threepts: player.children[7].innerText,
        pts: player.children[8].innerText,
        reb: player.children[9].innerText,
        ast: player.children[10].innerText,
        st: player.children[11].innerText,
        blk: player.children[12].innerText,
        drafted: player.classList.contains('ys-isdrafted'),
      }
    });

    console.log("Sending player names to popup:", playerNames);
    // Send the player names back to the popup
    sendResponse({ players: playerNames });
  } else if (message.request === "getDraftData") {
    console.log("Received request for draft data");
    // Get the draft elements
    console.log("Querying .PickInfo");
    const draftElements = document.querySelectorAll('.PickInfo'); // Adjust this selector as necessary
    const draftPicks = Array.from(draftElements).map(pick => {
      return {
        team: pick.children[0].innerText,
        pick: pick.children[1].innerText,
        player: pick.children[2].innerText,
        playerId: pick.children[2].getAttribute('data-id'),
      }
    });

    console.log("Sending draft picks to popup:", draftPicks);
    // Send the draft picks back to the popup
    sendResponse({ draftPicks: draftPicks });
  }
});
