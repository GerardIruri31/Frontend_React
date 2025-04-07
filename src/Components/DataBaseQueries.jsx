import React, { useState, useRef, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import "./DataBaseQueries.css";
import clickSound from "../Sounds/clicksound.mp3"; // Asegúrate de tener este archivo en la carpeta src
import { useMsal } from "@azure/msal-react";

const DataBaseQueries = () => {
  const { instance } = useMsal();
  
  const [userRol, setUserRol] = useState("");  
    useEffect(() => {
      const account = instance.getActiveAccount();
      const rol = account?.idTokenClaims?.jobTitle ? account.idTokenClaims.jobTitle.toLowerCase() : "null";
      setUserRol(rol);
    }, [instance]);
  const navigate = useNavigate();
  // 🔹 Estados para cada filtro
  const [postDateFrom, setPostDateFrom] = useState("");
  const [postDateTo, setPostDateTo] = useState("");
  const [trackingDateFrom, setTrackingDateFrom] = useState("");
  const [trackingDateTo, setTrackingDateTo] = useState("");
  const [author, setAuthor] = useState("");
  const [book, setBook] = useState("");
  const [publisher, setPublisher] = useState("");
  const [sceneCode, setSceneCode] = useState("");
  const [postType, setPostType] = useState("");
  const [tikTokUsername, setTikTokUsername] = useState("");
  const [postID, setpostID] = useState("");
  const [region, setRegion] = useState("");
  const [viewsRange, setViewsRange] = useState({ min: "", max: "" });
  const [LikesRange, setLikesRange] = useState({ min: "", max: "" });
  const [SavesRange, setSavesRange] = useState({ min: "", max: "" });
  const [engagement, setEngagement] = useState({ min: "", max: "" });
  const [interactions, setInteractions] = useState({ min: "", max: "" });

  // 🔹 Estados para el manejo de datos y resultados
  const [records, setRecords] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [buttonText, setButtonText] = useState("Initiate Database Query");
  const [log, setLog] = useState([]);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  // Sonidos al hacer clic
  const audioRef = useRef(new Audio(clickSound));
  const playSound = () => {
    audioRef.current.volume = 0.5; // 🎚 Ajusta el volumen (0.0 - 1.0)
    audioRef.current.loop = false; // 🔄 Evita que el sonido se repita automáticamente
    audioRef.current.currentTime = 0; // ⏪ Reinicia el audio en cada clic para evitar retrasos
    audioRef.current.play();
  };

  // 🔹 Manejo de la consulta a BD
  const handleDBQuery = async () => {
    if (!postDateFrom || !postDateTo) {
      alert("⚠️ All Posted Date fields are required!");
      return; // Detiene la ejecución si hay campos vacíos
    }

    const FechaPostDateFrom = new Date(postDateFrom);
    const FechaPostDateTo = new Date(postDateTo);

    // Validamos si la fecha inicial es mayor que la final
    if (FechaPostDateFrom > FechaPostDateTo) {
      alert(
        "⚠️ The 'From' Posted Date must be earlier than the 'To' Posted date."
      );
      return;
    }

    if (!trackingDateFrom !== !trackingDateTo) {
      alert("⚠️ Now All Tracking Date fields are required!");
      return;
    }

    if (trackingDateFrom && trackingDateTo) {
      const FechaTrackingFrom = new Date(trackingDateFrom);
      const FechaTrackingTo = new Date(trackingDateTo);
      if (FechaTrackingFrom > FechaTrackingTo) {
        alert(
          "⚠️ The 'From' Tracking Date must be earlier than the 'To' Tracking date."
        );
        return;
      }
    }

    // Confirmaciones dobles
    if (
      window.confirm("🚨 Are you sure you want to start the Database Query?")
    ) {
      setLog([]); // Limpia el log de mensajes
      setRecords([]); // Limpia los registros anteriores
      setDataLoaded(false);
      setButtonDisable(true);
      setButtonText("Database Query in Progress..."); // Cambia el texto mientras se ejecuta
      setIsLoading(true);
      const startTime = new Date();

      setLog((prevLog) => [
        ...prevLog,
        `📅 ${startTime.toLocaleString()} | Starting request to the APIRest...`,
      ]);

      const requestBody = {
        PubStartDate: postDateFrom,
        PubFinishtDate: postDateTo,
        TrackStartDate: trackingDateFrom,
        TrackFinishtDate: trackingDateTo,
        AuthorList: author
          ? author
              .split(",")
              .map((item) => item.trim().toUpperCase())
              .filter(Boolean)
          : [],
        BookList: book
          ? book
              .split(",")
              .map((item) => item.trim().toUpperCase())
              .filter(Boolean)
          : [],
        PAList: publisher
          ? publisher
              .split(",")
              .map((item) => item.trim().toUpperCase())
              .filter(Boolean)
          : [],
        SceneList: sceneCode
          ? sceneCode
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        typePostList: postType
          ? postType
              .split(",")
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean)
          : [],
        AccountList: tikTokUsername
          ? tikTokUsername
              .split(",")
              .map((item) => item.trim().toLowerCase())
              .filter(Boolean)
          : [],
        PostIDList: postID
          ? postID
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        RegionList: region
          ? region
              .split(",")
              .map((item) => item.trim().toUpperCase())
              .filter(Boolean)
          : [],
        viewsMin: viewsRange.min,
        viewsMax: viewsRange.max,
        likesMin: LikesRange.min,
        likesMax: LikesRange.max,
        savesMin: SavesRange.min,
        savesMax: SavesRange.max,
        EngagementMin: engagement.min,
        EngagementMax: engagement.max,
        InteractionMin: interactions.min,
        InteractionMax: interactions.max,
      };

      console.log(
        "🚀 Starting query to the database with data (DataBaseQueries - handleDBQuery):",
        requestBody
      );

      try {
        setLog((prevLog) => [
          ...prevLog,
          "🔄 Connecting to the PostgreSQL Database on the Azure Service",
        ]);

        // 🔹 Aquí llamarías a tu endpoint backend, p.ej.:
        //const azureURL = "http://localhost:8080";
        //const azureURL ="https://capp-springbootv1.thankfulfield-1f17e46d.centralus.azurecontainerapps.io";
        const azureURL = import.meta.env.VITE_AZURE_API_URL;
        const response = await fetch(azureURL + "/databasequery/filter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          alert(`❌ Server responded with status ${response.status}`);
          throw new Error(`Server responded with status ${response.status}`);
        }

        setLog((prevLog) => [
          ...prevLog,
          "📥 Successful responde from Database Query. Processing data ...",
        ]);

        const data = await response.json();
        console.log("API Response (DatabaseQueries - handleDBQuery):", data);
        const filteredData = data.map((record) => ({
          "Post Code": record["Post Code"] || "Not found: N/A",
          "Author Name": record["Author name"] || "Not found: N/A",
          "Book Name": record["Book name"] || "Not found: N/A",
          "Number of Scene": record["Number of Scene"] || "Not found: N/A",
          "Scene Name": record["Scene name"] || "Not found: N/A",
          "Post Type": record["Post Type"] || "Not found: N/A",
          "PA Name": record["PA name"] || "Not found: N/A",
          "Date Posted": record["Date posted"] || "Not found: N/A",
          "Time Posted": record["Time posted"] || "Not found: N/A",
          "TikTok Username": record["TikTok Username"] || "Not found: N/A",
          "Post URL": record["Post URL"] || "Not found: N/A",
          Views: record["Views"] || 0,
          Likes: record["Likes"] || 0,
          Comments: record["Comments"] || 0,
          Reposted: record["Reposted"] || 0,
          Saves: record["Saves"] || 0,
          "Engagement Rate":
            Math.round(record["Engagement rate"] * 100.0) / 100.0 || 0,
          Interactions: record["Interactions"] || 0,
          Hashtags: record["Hashtags"] || "Not found: N/A",
          "# of Hashtags": record["Number of Hashtags"] || 0,
          "Sound URL": record["Sound URL"] || "Not found: N/A",
          "Region of Posting": record["Region Code"] || "Not found: N/A",
          "Tracking Date": record["Tracking date"] || "Not found: N/A",
          "Tracking Time": record["Tracking time"] || "Not found: N/A",
          "Logged-in User": record["Logged-in User"] || "Not found: N/A",

        }));
        setRecords(filteredData);
        const registrosProcesados = data.length;
        setLog((prevLog) => [
          ...prevLog,
          `📊 Amount of Records from Database Query Processed: ${registrosProcesados}`,
        ]);
        const endTime = new Date();
        const durationInSeconds = Math.floor((endTime - startTime) / 1000); // 🔹 Convertimos a segundos enteros
        const minutes = Math.floor(durationInSeconds / 60); // 🔹 Extraemos los minutos
        const seconds = durationInSeconds % 60; // 🔹 Extraemos los segundos restantes
        const formattedTime = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`; // 🔹 Formateamos el tiempo

        setLog((prevLog) => [
          ...prevLog,
          `⏳ Total function execution time: ${formattedTime} minutes`,
        ]);
        if (data.length > 0) {
          setLog((prevLog) => [
            ...prevLog,
            `✅ Server is ready for downloading the generated Excel file`,
          ]);
        } else {
          setLog((prevLog) => [
            ...prevLog,
            `❌ Execution not completed. No data available`,
          ]);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error(
          "❌ Error fetching data from DB (DatabaseQueries - handleDBQuery):",
          error
        );
        alert("❌ Failed to fetch data from DB.");
      } finally {
        setIsLoading(false);
        setButtonDisable(false);
        setButtonText("Initiate Database Query");
      }
    }
  };

  // 🔹 Manejo de exportar a Excel
  const handleExportToExcel = async () => {
    if (!dataLoaded) {
      alert("⚠️ You must make the database query first.");
      return;
    }
    setIsLoadingExcel(true);
    try {
      //const azureURL ="https://capp-springbootv1.thankfulfield-1f17e46d.centralus.azurecontainerapps.io";
      //const azureURL = "http://localhost:8080";
      const azureURL = import.meta.env.VITE_AZURE_API_URL;
      const response = await fetch(azureURL + "/databasequery/download", {
        method: "GET",
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        mode: "cors", // 🔹 IMPORTANTE para evitar bloqueos CORS
      });
      if (!response.ok) throw new Error("Error al descargar el archivo");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      // Obtener la fecha y hora actual en el formato "yyyy-MM-dd_HH-mm-ss"
      const now = new Date();
      const timestamp =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        "-" +
        String(now.getMinutes()).padStart(2, "0") +
        "-" +
        String(now.getSeconds()).padStart(2, "0");
      const fileName = `filtros_tiktok_videos_${timestamp}.xlsx`; // Nombre generado en frontend
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      // Ejemplo de llamada a tu endpoint que genera un Excel
      // El nombre del archivo podría ser "DB_Query_2025-02-13_10-42-52.xlsx" etc.
      alert("✅ Excel File exported with success");
      console.log(
        "✅ Excel File exported with success (DataBaseQueries - handleExportExcel): " +
          fileName
      );
    } catch (error) {
      console.error(
        "❌ Error downloading the Excel File (DataBaseQueries): ",
        error
      );
      alert("❌ Error downloading the Excel File");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  return (
    <div className="dbqueries-container">
      {/* Header */}
      <header className="dbqueries-header">
        <h1>DATABASE QUERIES</h1>
        <button
          className="return-button"
          onClick={() => {
            if (userRol == "admin") {
              navigate("/home");
            } else if (userRol == "analyst") {
              navigate("/home-analyst");
            } else if (userRol == "null") {
              navigate("/home-analyst"); // fallback en caso no tenga rol
            } else {
              navigate("/home-analyst");
            }
            playSound();
          }}
        >
          Return to Home Screen
        </button>
      </header>

      {/* Filtros */}
      <div className="dbqueries-filters">
        <div className="date-section">
          <div className="date-group">
            <label>Post Date (From - To):</label>
            <div className="date-range-container">
              <input
                type="date"
                value={postDateFrom}
                onChange={(e) => setPostDateFrom(e.target.value)}
              />
              <input
                type="date"
                value={postDateTo}
                onChange={(e) => setPostDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="date-group">
            <label>Tracking Date (From - To):</label>
            <div className="date-range-container">
              <input
                type="date"
                value={trackingDateFrom}
                onChange={(e) => setTrackingDateFrom(e.target.value)}
              />
              <input
                type="date"
                value={trackingDateTo}
                onChange={(e) => setTrackingDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Author Name:</label>
            <textarea
              type="text"
              placeholder="e.g Author1, Author2 .."
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="filter-group">
            <label>Book Name:</label>
            <textarea
              style={{ textTransform: "uppercase" }}
              type="text"
              placeholder="e.g. book1, book2 ..."
              value={book}
              onChange={(e) => setBook(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Publisher:</label>
            <textarea
              style={{ textTransform: "uppercase" }}
              type="text"
              placeholder="e.g. PA1, PA2 ..."
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Scene code:</label>
            <textarea
              type="text"
              placeholder="e.g. SC12a, BC07v1 ..."
              value={sceneCode}
              onChange={(e) => setSceneCode(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Post type:</label>
            <textarea
              style={{ textTransform: "lowercase" }}
              type="text"
              placeholder="e.g. a, b, c"
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>TikTok Username:</label>
            <textarea
              style={{ textTransform: "lowercase" }}
              type="text"
              placeholder="e.g. user1, user2 ..."
              value={tikTokUsername}
              onChange={(e) => setTikTokUsername(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Post ID:</label>
            <textarea
              type="text"
              placeholder="e.g. 7470954750, 7567654355"
              value={postID}
              onChange={(e) => setpostID(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Post Region:</label>
            <textarea
              style={{ textTransform: "uppercase" }}
              type="text"
              placeholder="e.g. us, pe ..."
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Views (min - max):</label>
            <div className="views-range">
              <input
                type="number"
                placeholder="min"
                min="1"
                value={viewsRange.min}
                onChange={(e) =>
                  setViewsRange({ ...viewsRange, min: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
              <input
                type="number"
                placeholder="max"
                min="1"
                value={viewsRange.max}
                onChange={(e) =>
                  setViewsRange({ ...viewsRange, max: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Likes (min - max):</label>
            <div className="likes-range">
              <input
                type="number"
                placeholder="min"
                min="1"
                value={LikesRange.min}
                onChange={(e) =>
                  setLikesRange({ ...LikesRange, min: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
              <input
                type="number"
                placeholder="max"
                min="1"
                value={LikesRange.max}
                onChange={(e) =>
                  setLikesRange({ ...LikesRange, max: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Saves (min - max):</label>
            <div className="saves-range">
              <input
                type="number"
                placeholder="min"
                min="1"
                value={SavesRange.min}
                onChange={(e) =>
                  setSavesRange({ ...SavesRange, min: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
              <input
                type="number"
                placeholder="max"
                min="1"
                value={SavesRange.max}
                onChange={(e) =>
                  setSavesRange({ ...SavesRange, max: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Engagement %:</label>
            <div className="engagement-range">
              <input
                type="number"
                placeholder="min"
                min="1"
                value={engagement.min}
                onChange={(e) =>
                  setEngagement({ ...engagement, min: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
              <input
                type="number"
                placeholder="max"
                min="1"
                value={engagement.max}
                onChange={(e) =>
                  setEngagement({ ...engagement, max: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Interactions:</label>
            <div className="interactions-range">
              <input
                type="number"
                placeholder="min"
                min="1"
                value={interactions.min}
                onChange={(e) =>
                  setInteractions({ ...interactions, min: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
              <input
                type="number"
                placeholder="max"
                min="1"
                value={interactions.max}
                onChange={(e) =>
                  setInteractions({ ...interactions, max: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "-") {
                    e.preventDefault(); // 🔹 Bloquea la tecla de punto y coma
                  }
                }}
              />
            </div>
          </div>
        </div>

        <button
          className="dbquery-button"
          onClick={() => {
            handleDBQuery();
            playSound();
          }}
          disabled={buttonDisable}
        >
          {buttonDisable ? buttonText : buttonText}
        </button>
      </div>

      <div className="dbqueries-results">
        <h1>Overview of Database Query Monitoring</h1>
        {isLoading ? (
          <div className="no-data-container51">
            <img
              src="https://i.gifer.com/4V0b.gif"
              alt="Loading..."
              className="loading-spinner"
            />
          </div>
        ) : !dataLoaded ? (
          <div className="no-data-container51">
            <h2>No Data Found</h2>
            <p>We couldn't find any data to display.</p>
          </div>
        ) : (
          <div className="log-content">
            {log.map((entry, index) => (
              <p key={index}>{entry}</p>
            ))}
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Post Code</th>
              <th>Author Name</th>
              <th>Book Name</th>
              <th>Number of Scene</th>
              <th>Scene Name</th>
              <th>Post Type</th>
              <th>PA Name</th>
              <th>Date Posted</th>
              <th>Time Posted</th>
              <th>Username TikTok Account</th>
              <th>Post URL</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Reposted</th>
              <th>Saves</th>
              <th>Engagement Rate</th>
              <th>Interactions</th>
              <th>Hashtags</th>
              <th># of Hashtags</th>
              <th>Sound URL</th>
              <th>Region of Posting</th>
              <th>Tracking Date</th>
              <th>Tracking Time</th>
              <th>Logged-in User</th>
            </tr>
          </thead>

          <tbody>
            {records.length > 0 ? (
              records.slice(0, 20).map((record, index) => {
                const videoUrl = record["Post URL"] || "";
                const match = videoUrl.match(/video\/(\d+)/);
                const videoId = match ? match[1] : "Not found: N/A";

                const soundURL = record["Sound URL"] || "";
                const soundmatch = soundURL.match(/music\/.*?-(\d+)/);
                const soundId = soundmatch ? soundmatch[1] : "Not found: N/A";

                return (
                  <tr key={index}>
                    <td>{record["Post Code"]}</td>
                    <td>{record["Author Name"]}</td>
                    <td>{record["Book Name"]}</td>
                    <td>{record["Number of Scene"]}</td>
                    <td>{record["Scene Name"]}</td>
                    <td>{record["Post Type"]}</td>
                    <td>{record["PA Name"]}</td>
                    <td>{record["Date Posted"]}</td>
                    <td>{record["Time Posted"]}</td>
                    <td>{record["TikTok Username"]}</td>
                    <td>
                      {videoUrl ? (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {videoId}
                        </a>
                      ) : (
                        "No URL"
                      )}
                    </td>
                    <td>{record["Views"]}</td>
                    <td>{record["Likes"]}</td>
                    <td>{record["Comments"]}</td>
                    <td>{record["Reposted"]}</td>
                    <td>{record["Saves"]}</td>
                    <td>{record["Engagement Rate"]}</td>
                    <td>{record["Interactions"]}</td>
                    <td>{record["Hashtags"]}</td>
                    <td>{record["# of Hashtags"]}</td>
                    <td>
                      {soundURL ? (
                        <a
                          href={soundURL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {soundId}
                        </a>
                      ) : (
                        "No Sound"
                      )}
                    </td>
                    <td>{record["Region of Posting"]}</td>
                    <td>{record["Tracking Date"]}</td>
                    <td>{record["Tracking Time"]}</td>
                    <td>{record["Logged-in User"]}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="25" className="no-data-placeholder">
                  <div className="no-data-row5">
                    <div className="no-data-container5 table">
                      <h2>No Data Found</h2>
                      <p>We couldn't find any data to display.</p>
                    </div>
                    <div className="no-data-container5 table">
                      <h2>No Data Found</h2>
                      <p>We couldn't find any data to display.</p>
                    </div>
                    <div className="no-data-container5 table">
                      <h2>No Data Found</h2>
                      <p>We couldn't find any data to display.</p>
                    </div>
                    <div className="no-data-container5 table">
                      <h2>No Data Found</h2>
                      <p>We couldn't find any data to display.</p>
                    </div>
                    <div className="no-data-container5 table">
                      <h2>No Data Found</h2>
                      <p>We couldn't find any data to display.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        className="export-dbquery-button"
        onClick={() => {
          handleExportToExcel();
          playSound();
        }}
      >
        Export to Excel
      </button>

      {isLoadingExcel && (
        <div className="loading-overlay">
          <div className="loading-spinner-container">
            <img src="https://i.gifer.com/XVo6.gif" alt="Loading..." />
            <p> Please wait, Downloading the Excel file </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataBaseQueries;
