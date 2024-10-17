document.getElementById("upload").addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
	const files = event.target.files;
	const playerListDiv = document.getElementById("playerList");

	playerListDiv.innerHTML = ""; // Clear previous list

	// biome-ignore lint/complexity/noForEach: <explanation>
	Array.from(files).forEach((file) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target.result;
			const players = content
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean);

			// biome-ignore lint/complexity/noForEach: <explanation>
			players.forEach((player) => {
				const playerDiv = document.createElement("div");
				playerDiv.className = "player";
				playerDiv.textContent = player;
				playerListDiv.appendChild(playerDiv);
			});
		};
		reader.readAsText(file);
	});
}

