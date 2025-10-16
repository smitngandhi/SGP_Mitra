from app.utils.agent_executor_utils import mental_health_chatbot

# Initialize the client
# client = InferenceClient(token="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")

# Define your text prompt
# prompt = "lo-fi music with a soothing melody"

# # Generate audio using the generic post method
# audio_bytes = client.post(
#     json={"inputs": prompt},
#     model="facebook/musicgen-small"
# )

# # Save the audio file
# with open("musicgen_out.wav", "wb") as f:
#     f.write(audio_bytes)

# print("Audio successfully saved as musicgen_out.wav")


user_message = "I've been feeling anxious lately and can't sleep properly. What can I do to calm my mind?"

# Invoke the mental health chatbot
response = mental_health_chatbot.invoke({"input": user_message})

# Print the chatbot's reply
print(response["output"])