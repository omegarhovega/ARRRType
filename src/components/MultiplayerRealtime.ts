import { reactive, ref } from "vue";
import type { Ref, ComputedRef } from "vue";
import { supabase } from "../supabase";

interface PayloadType {
    playerId: string;
    progress: number;
}

// logic for human vs. human game, unique playerIDs and gameId used for identification
// supabase realtime channel created for every individual game where players broadcast progress to each other and heartbeat to measure latency
export function useMultiplayerRealtime(
    gameId: ComputedRef<string | null>,
    playerID: string,
    resultMessage: Ref<string>,
    playerWon: Ref<boolean>,
    handlePvPLevelWin: () => void,
    startTime: Ref<Date | null>,
    countdownStart: () => void,
    roundTripLatency: Ref<number>,
) {
    const channel = supabase.channel(`game_${gameId.value}`);
    console.log(`Channel initialized for game: ${gameId.value}`);

    const opponents: Ref<any[]> = ref([]);
    const opponentProgresses = reactive<Record<string, number>>({});
    let heartbeatInterval: NodeJS.Timeout | null = null;
    const latency = ref(0);

    const players = ref([]);
    const isChannelSubscribed = ref(false);

    // Heartbeat channel listens for UPDATE events in supabase games row with gameId
    const heartbeatchannel = supabase.channel(`game-heartbeat-${gameId.value}`)
        .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId.value}`,
        }, (payload) => {
            handleHeartbeatUpdate(payload);
        });

    // calculate latency based on heartbeat (currently not shown but round-trip latency is used)
    function handleHeartbeatUpdate(payload: any) {
        const updatedHeartbeat = payload.new.heartbeat;
        const timestampString = sessionStorage.getItem("lastHeartbeatTimestamp");

        if (timestampString) {
            const timestampBeforeRpc = parseInt(timestampString, 10);
            const now = Date.now();
            const userHeartbeat = updatedHeartbeat.find((hb: any) => hb.user_id === playerID);

            if (userHeartbeat) {
                latency.value = (now - timestampBeforeRpc) / 2;
            }
        } else {
            console.error("No timestamp found in sessionStorage for last heartbeat.");
        }
    }

    const callInsertHeartbeat = async (gameId: any, userId: any) => {
        const timestampBeforeRpc = Date.now(); // Record the timestamp before supabase remote heartbeat function call

        const { data, error } = await supabase.rpc("update_heartbeat", {
            game_id: gameId,
            user_id: userId,
        });

        if (error) {
            console.log("Error calling insert_heartbeat:", error.message);
        } else {
            // Store the timestamp to compare with the server's response to calculate round-trip latency
            sessionStorage.setItem(
                "lastHeartbeatTimestamp",
                timestampBeforeRpc.toString()
            );
        }
    };

    const handleHeartbeat = async () => {
        if (gameId.value == null) {
            return;
        } else {
            console.log("calling insert Heartbeat with", gameId.value, playerID);
            callInsertHeartbeat(gameId.value, playerID);
        }
    };


    // Function to broadcast current progress in supabase realtime game channel to update different progress bars shown for each player
    async function broadcastProgress(newProgress: number, oldProgress: number) {
        if (isChannelSubscribed.value && newProgress !== oldProgress) {
            const messageId = `${Date.now()}-${playerID}`;
            const sendTimestamp = Date.now();
            console.log(`Broadcasting progress: ${newProgress}`);
            channel.send({
                type: "broadcast",
                event: "current_progress",
                messageId,
                timestamp: sendTimestamp,
                payload: {
                    playerId: playerID,
                    progress: newProgress,
                },
            });

            if (newProgress === 100) {
                // sets game finish time once progress in 100%
                await updateGameFinishTime();
            }
        }
    }

    // Function to update game finish time to determine winner
    async function updateGameFinishTime() {
        const currentTime = new Date().toISOString();

        // Fetch the existing finishing_times from the database
        const { data: existingData, error: fetchError } = await supabase
            .from("games")
            .select("finishing_times")
            .eq("id", gameId.value);

        if (fetchError) {
            console.error(
                "Error fetching existing finishing_times:",
                fetchError
            );
            return;
        }

        // Merge any existing finishing_times with the current player's time
        const existingFinishingTimes =
            existingData?.[0]?.finishing_times || {};
        const updatedFinishingTimes = {
            ...existingFinishingTimes,
            [playerID]: currentTime,
        };

        // Update finishing_times in the database
        const { error: updateError } = await supabase
            .from("games")
            .update({ finishing_times: updatedFinishingTimes })
            .eq("id", gameId.value);

        if (updateError) {
            console.error("Error updating finishing_times:", updateError);
        } else {
            // Determine if the player is the winner
            const finishingTimesArray = Object.values(
                updatedFinishingTimes
            ).map((time) => new Date(time as string));
            const playerFinishTime = new Date(updatedFinishingTimes[playerID]);

            // determine game end message for player depending on win or loss
            if (
                finishingTimesArray.every(
                    (otherTime) => playerFinishTime <= otherTime
                )
            ) {
                resultMessage.value = "You Won";
                playerWon.value = true;
                handlePvPLevelWin();
            } else {
                resultMessage.value = "You Lost";
                playerWon.value = false;
            }
        }
    }

    // initial setup of multiplayer game
    async function setupMultiplayerGame() {
        // Fetch game details
        const { data: gameData, error: gameError } = await supabase
            .from("games")
            .select("players, start_time")
            .eq("id", gameId.value);

        if (gameError) {
            console.error("Error fetching game details:", gameError);
        } else if (gameData && gameData[0]) {
            // Populate the players ref if available
            if (gameData[0].players) {
                players.value = gameData[0].players;
                console.log("Game Data:", gameData);
                opponents.value = players.value.filter(
                    (player) => player !== playerID
                );
                console.log("Opponents:", opponents.value);
                console.log("Current Player ID:", playerID);
            }

            // Start countdown for game once the set start time is reached
            if (gameData[0].start_time) {
                startTime.value = gameData[0].start_time;
                countdownStart();
            }
        }

        // Setup channel subscriptions for players
        setupChannelSubscriptions();
        isChannelSubscribed.value = true;

        console.log("Multiplayer game setup complete.");
    }

    // separate supabase channel for hearbeat
    function setupChannelSubscriptions() {
        heartbeatchannel.subscribe();
        // Send a heartbeat message every 5 seconds
        heartbeatInterval = setInterval(handleHeartbeat, 5000);
        channel
            .on("broadcast", { event: "current_progress" }, handleCurrentProgressUpdate)
            .on("broadcast", { event: "echo_latency" }, handleEchoLatency)
            .on("broadcast", { event: "finished" }, handleFinishedEvent)
            .subscribe();

        isChannelSubscribed.value = true;
    }


    function handleCurrentProgressUpdate(payload: any) {
        const typedPayload = payload.payload as PayloadType;
        if (payload.payload && payload.payload.playerId !== playerID) {
            // update opponent progress in local state
            opponentProgresses[typedPayload.playerId] = typedPayload.progress;
        }
        // if own progress, send update
        const echoTimestamp = Date.now();
        channel.send({
            type: "broadcast",
            event: "echo_latency",
            originalTimestamp: payload.timestamp,
            echoTimestamp,
        });
    }

    // calculate own round-trip latency
    function handleEchoLatency(payload: any) {
        const receiveTimestamp = Date.now();
        const originalTimestamp = payload.originalTimestamp;
        roundTripLatency.value = receiveTimestamp - originalTimestamp;
    }

    function handleFinishedEvent(payload: any) {
        // Mark the opponent as finished for broadcast
        if (payload.playerId !== playerID) {
            console.log(
                "Received opponent's finished status: ",
                payload
            );
        }
    }

    // end heartbeat channel and processing
    function cleanup() {
        if (heartbeatInterval !== null) {
            clearInterval(heartbeatInterval);
        }
        heartbeatchannel.unsubscribe();
        supabase.removeChannel(channel);
        isChannelSubscribed.value = false;
    }

    return {
        channel,
        opponentProgresses,
        latency,
        opponents,
        heartbeatInterval,
        playerWon,
        broadcastProgress,
        setupChannelSubscriptions,
        cleanup,
        handleCurrentProgressUpdate,
        handleEchoLatency,
        handleFinishedEvent,
        setupMultiplayerGame,
    };
}
