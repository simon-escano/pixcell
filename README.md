
# 🧬 Pixcell

Pixcell is a real-time collaboration and diagnostic platform designed for medical professionals, particularly pathologists, medical technologists, and hematologists. The platform allows users to upload, annotate, and collaboratively comment on microscopic sample images. Pixcell uses AI-powered image processing (**YOLOv8**) to detect and count cells like LE Cells, parasites, WBCs, RBCs, and platelets. Additionally, it integrates an LLM (e.g., GPT or DeepSeek) to help generate diagnostic reports based on AI detections. The platform also includes lightweight patient management features for improved workflow.

---

## 👥 Collaborators

- [@aizernere](https://github.com/aizernere)
- [@tomasdanjo](https://github.com/tomasdanjo)
- [@moltmalt](https://github.com/moltmalt)

---

## 🛠️ Technologies

Pixcell is built using the following technologies:

- **Frontend**: 
  - **Next.js** for server-side rendering and static site generation.
  - **Tailwind CSS** for styling and responsive design.
  - **Shadcn UI** for UI components.
- **Backend**: 
  - **FastAPI** for building the API endpoints.
  - **YOLOv8** for cell detection and image processing.
  - **Flask/FastAPI** for backend services (to be decided based on requirements).
  - **Supabase** for database and authentication.
  - **Drizzle ORM** for interacting with the database.
  - **Python libraries** like **OpenCV**, **Pillow**, **Matplotlib**, **NumPy**, and others for image processing and AI operations.

---

## 💻 Frontend (Next.js)

The frontend of Pixcell is a **Next.js** application. It uses **React** components to dynamically update the UI based on data from the backend. The frontend interacts with the backend through API calls and displays images with annotations, bounding boxes, and diagnostic reports.

### 🚀 Getting Started

1. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Setup environment variables**

Create a `.env.local` file in the root of the frontend directory and add:

```env
DATABASE_URL=your-database-connection-url
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. **Generate and migrate the database schema**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit push
```

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

### 🧠 How it Works

- **Image Upload**: Users upload an image (microscopic sample).
- **Prediction**: On clicking the "Predict" button, the image is sent to the backend, and the AI model detects cells and generates bounding boxes.
- **Display**: The frontend then displays the image with the bounding boxes and any relevant diagnostic data.

---

## 🧪 Backend (FastAPI)

The backend of Pixcell is built using **FastAPI** for handling API requests. It uses **YOLOv8** for object detection and image processing to identify various cells in medical images. It supports receiving image uploads, processing the images, and returning them with annotations.

### ⚙️ Setting Up the Backend

1. **Create a virtual environment**:

```bash
python -m venv env
```

2. **Activate the virtual environment**:

- On Windows:

```bash
env\Scripts\activate
```

- On macOS/Linux:

```bash
source env/bin/activate
```

3. **Install dependencies**:

```bash
pip install -r requirements.txt
```

4. **Run the FastAPI app**:

```bash
uvicorn main:app --reload
```

Visit [http://localhost:8000](http://localhost:8000) to access the API.

### 🔌 API Endpoints

- `POST /predict`: Accepts an image and returns annotated predictions.

---

## 🧪 Testing the Application

1. Run the backend server.
2. Open the frontend at `http://localhost:3000`.
3. Upload an image and click "Predict".
4. View the result with bounding boxes and AI annotations.

---

## 📦 Requirements

### Backend Dependencies

```txt
annotated-types==0.7.0
anyio==4.9.0
certifi==2025.4.26
charset-normalizer==3.4.2
click==8.1.8
colorama==0.4.6
coloredlogs==15.0.1
contourpy==1.3.2
cycler==0.12.1
fastapi==0.115.12
filelock==3.18.0
flatbuffers==25.2.10
fonttools==4.57.0
fsspec==2025.3.2
h11==0.16.0
humanfriendly==10.0
idna==3.10
Jinja2==3.1.6
kiwisolver==1.4.8
MarkupSafe==3.0.2
matplotlib==3.10.1
mpmath==1.3.0
networkx==3.4.2
numpy==2.2.5
onnx==1.17.0
onnxruntime==1.21.1
opencv-python==4.11.0.86
packaging==25.0
pandas==2.2.3
pillow==11.2.1
protobuf==6.30.2
psutil==7.0.0
py-cpuinfo==9.0.0
pydantic==2.11.4
pydantic_core==2.33.2
pyparsing==3.2.3
pyreadline3==3.5.4
python-dateutil==2.9.0.post0
python-multipart==0.0.20
pytz==2025.2
PyYAML==6.0.2
requests==2.32.3
scipy==1.15.2
seaborn==0.13.2
six==1.17.0
sniffio==1.3.1
starlette==0.46.2
sympy==1.14.0
torch==2.7.0
torchvision==0.22.0
tqdm==4.67.1
typing-inspection==0.4.0
typing_extensions==4.13.2
tzdata==2025.2
ultralytics==8.3.127
ultralytics-thop==2.0.14
urllib3==2.4.0
uvicorn==0.34.2
```

(💡 Optional) Update the file with:

```bash
pip freeze > requirements.txt
```

---

## ✅ Conclusion

Pixcell provides a robust solution for medical professionals to collaborate on image analysis and diagnostics. By combining AI image processing with real-time collaboration, Pixcell streamlines workflows and supports accurate, efficient diagnoses.

For more details, check official docs for [Next.js](https://nextjs.org/), [FastAPI](https://fastapi.tiangolo.com/), or [YOLOv8](https://docs.ultralytics.com/).