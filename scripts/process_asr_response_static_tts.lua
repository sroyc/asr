-- process_asr_response.lua
-- play a different file based on the response
--
uuid = argv[1];
api = freeswitch.API();
wsbridge_asr_response = api:executeString("uuid_getvar "..uuid.." wsbridge_asr_response");
freeswitch.consoleLog("info", "ASR response: " .. wsbridge_asr_response .. "\n");
if (session:ready()) then
    if (wsbridge_asr_response == "none") then
	    session:streamFile("/usr/local/freeswitch/sounds/die_hard_response_none.wav");
    else if (wsbridge_asr_response == "yes") then
	    session:streamFile("/usr/local/freeswitch/sounds/die_hard_response_yes.wav");
    else
	    session:streamFile("/usr/local/freeswitch/sounds/die_hard_response_no.wav");
    end
    session:hangup("NORMAL_CLEARING");
end
end
