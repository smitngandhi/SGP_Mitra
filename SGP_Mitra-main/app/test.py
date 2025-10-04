from huggingface_hub import InferenceClient

# Initialize the client

# Define your text prompt
prompt = "lo-fi music with a soothing melody"

# Generate audio using the generic post method
audio_bytes = client.post(
    json={"inputs": prompt},
    model="facebook/musicgen-small"
)

# Save the audio file
with open("musicgen_out.wav", "wb") as f:
    f.write(audio_bytes)

print("Audio successfully saved as musicgen_out.wav")