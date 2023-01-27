-- process_asr_response.lua
-- generate a different message based on the response
--
uuid = argv[1];
api = freeswitch.API();
wsbridge_asr_response = api:executeString("uuid_getvar "..uuid.." wsbridge_asr_response");
freeswitch.consoleLog("info", "ASR response: " .. wsbridge_asr_response .. "\n");
if (session:ready()) then
    if (wsbridge_asr_response == "none") then
	    session:set_tts_params("tts_commandline", "en-us");
	    session:speak("Could not understand your response. Goodbye!");
    else if (wsbridge_asr_response == "yes") then
	    session:set_tts_params("tts_commandline", "en-us");
	    session:speak("You think Die Hard is a Christmas movie. Goodbye!");
    else
	    session:set_tts_params("tts_commandline", "en-us");
	    session:speak("You don’t think Die Hard is a Christmas movie. Goodbye!");
    end
    session:hangup("NORMAL_CLEARING");
end
end
