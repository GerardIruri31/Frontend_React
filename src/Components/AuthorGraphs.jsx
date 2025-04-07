import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthorGraphs.css";
import clickSound from "../Sounds/clicksound.mp3";
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  BarChart,
  Label,
} from "recharts";
import html2canvas from "html2canvas";
import { useMsal } from "@azure/msal-react";

const PaGraphs = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();
  

  const [userRol, setUserRol] = useState("");
  useEffect(() => {
    const account = instance.getActiveAccount();
    const rol = account?.idTokenClaims?.jobTitle ? account.idTokenClaims.jobTitle.toLowerCase() : "null";
    setUserRol(rol);
  
  }, [instance]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [authors, setAuthors] = useState("");
  //const [books, setBooks] = useState("");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [textButtom, setTextButtom] = useState("Generate Graphs");
  const [log, setLog] = useState([]);

  const audioRef = useRef(new Audio(clickSound));
  const playSound = () => {
    audioRef.current.volume = 0.5; // 🎚 Ajusta el volumen (0.0 - 1.0)
    audioRef.current.loop = false; // 🔄 Evita que el sonido se repita automáticamente
    audioRef.current.currentTime = 0; // ⏪ Reinicia el audio en cada clic para evitar retrasos
    audioRef.current.play();
  };

  const transformedData = records[1]
    ? Object.values(
        records[1].reduce((acc, item) => {
          const { fecpublicacion, nbrautora, sumnumviews } = item;

          if (!acc[fecpublicacion]) {
            acc[fecpublicacion] = { fecpublicacion }; // Crear la clave con la fecha
          }
          acc[fecpublicacion][nbrautora] = sumnumviews; // Asignar los views al autor correcto

          return acc;
        }, {})
      ).sort((a, b) => new Date(a.fecpublicacion) - new Date(b.fecpublicacion)) // 🔥 Ordenar por fecha
    : []; // 🔥 Si records[1] no está disponible, devolver una lista vacía

  // Referencias a los gráficos
  const graph1Ref = useRef(null);
  const graph2Ref = useRef(null);
  const graph3Ref = useRef(null);

  // Función para capturar y descargar gráfico
  // Función mejorada para capturar y descargar el gráfico
  const handleDownloadGraph = (graphRef, fileName) => {
    if (!graphRef.current) {
      alert("⚠️ No graph found to download.");
      return;
    }

    setTimeout(() => {
      const now = new Date(); // 🔥 Definir `now` correctamente dentro de la función

      html2canvas(graphRef.current, {
        backgroundColor: "white",
        scale: 3, // 📸 Aumentar la escala para máxima resolución
        useCORS: true, // 🚀 Evita problemas de CORS si hay imágenes externas
        logging: true, // 🔍 Ver errores en la consola

        windowWidth: graphRef.current.scrollWidth * 3, // Ajuste de ancho
        windowHeight: graphRef.current.scrollHeight * 3, // Ajuste de altura
      }).then((canvas) => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png", 1.0);
        const timestamp = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
          now.getHours()
        ).padStart(2, "0")}-${String(now.getMinutes()).padStart(
          2,
          "0"
        )}-${String(now.getSeconds()).padStart(2, "0")}`;
        const finalName = `${fileName}_${timestamp}`;
        link.download = `${finalName}.png`;
        link.click();
        console.log(
          "📥 Successfull image download (AuthorGraphs - handleDownloadGraph): " +
            finalName
        );
      });
    }, 500); // Pequeña pausa para asegurar el renderizado completo
  };

  const handleGetDataFromDB = async () => {
    if (!dateFrom || !dateTo || !authors) {
      alert("⚠️ ACTION REQUIRED: You must fill all the fields");
      return;
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Validamos si la fecha inicial es mayor que la final
    if (fromDate > toDate) {
      alert(
        "⚠️ The 'From' Posted Date must be earlier than the 'To' Posted Date."
      );
      return;
    }

    if (window.confirm("📊 Do you want to generate the graphs?")) {
      setRecords([]);
      setIsLoading(true);
      setDataLoaded(false);
      setTextButtom("Generating Graphs...");
      setLog([]);
      try {
        const startTime = new Date();

        const formattedAuthors = authors
          .split(",")
          .map((pa) => pa.trim().toUpperCase())
          .filter((u) => u !== "");

        {
          /*const formattedBooks = books
          .split(",")
          .map((pa) => pa.trim())
          .filter((u) => u !== "");*/
        }

        const body = {
          dateFrom: dateFrom,
          dateTo: dateTo,
          Author: formattedAuthors,
          //Books: formattedBooks,
        }; // Solo agrega "Books" si tiene valores

        console.log(
          "📤 Sending request with data (AuthorGraphs - handleGetDataFromDB): ",
          body
        );
        //const azureURL = "http://localhost:8080";
        //const azureURL ="https://capp-springbootv1.thankfulfield-1f17e46d.centralus.azurecontainerapps.io";
        const azureURL = import.meta.env.VITE_AZURE_API_URL;
        const response = await fetch(azureURL + "/authorsgraphs/getdata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
          body: JSON.stringify({
            dateFrom: dateFrom,
            dateTo: dateTo,
            Author: formattedAuthors,
          }),
        });

        if (!response.ok) {
          console.error(
            `🚨 Server responded with status (AuthorGraphs - handleGetDataFromDB) ${response.status}`
          );
          throw new Error(
            `🚨 An error occurred while fetching the data (AuthorGraphs - handleGetDataFromDB) ${response.status}`
          );
        }
        setLog((prevLog) => [
          ...prevLog,
          `🔗 Successful connection to the Azure container of the backend`,
        ]);

        setLog((prevLog) => [
          ...prevLog,
          `🚀 Successful connection to the PostgreSQL database `,
        ]);

        setLog((prevLog) => [
          ...prevLog,
          `📡 Data successfully retrieved from the Backend`,
        ]);

        const data = await response.json();

        //const NotFoundAuthors = formattedAuthors.filter(u => !(u in data[0]));

        const NotFoundAuthors = formattedAuthors.filter((u) => {
          return !data[0].some((dic) => dic && u == dic["codautora"]);
        });

        console.log(
          "API Response (AuthorGraphs - handleGetDataFromDB): ",
          data
        );
        console.log(
          "Not found Authors Code (AuthorGraphs - handleGetDataFromDB): " +
            NotFoundAuthors
        );
        setLog((prevLog) => [
          ...prevLog,
          `📊 Amount of Author Records obtained in the Database Process: ${data[0].length}`,
        ]);

        if (data[0].length > 0) {
          setLog((prevLog) => [
            ...prevLog,
            `✅ Execution completed successfully. Graphs ready to be downloaded`,
          ]);
        } else {
          setLog((prevLog) => [
            ...prevLog,
            `❌ Execution not completed. No data available`,
          ]);
        }
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

        setRecords(data);
        setDataLoaded(true);
      } catch (error) {
        console.error(
          "❌ Error extracting information from DB (AuthorGraphs - handleGetDataFromDB): ",
          error
        );
        alert("❌ An error occurred while generating the graphs");
      } finally {
        setIsLoading(false);
        setTextButtom("Generate Graphs");
      }
    }
  };
  return (
    <div className="PaGraphs-container-general2">
      <header className="PaGraphs-header2">
        <h1>AUTHOR GRAPHS</h1>
        <button
        
          className="return-botton-pa2"
          onClick={() => {
            if (userRol === "admin") {
              navigate("/home");
            } else if (userRol === "analyst") {
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

      <div className="filter-image-container2">
        <div className="filter-container4">
          <label>Date Posted (From - To):</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <label>Authors:</label>
          <textarea
            style={{ textTransform: "uppercase" }}
            placeholder="Enter the Author's code separated by commas"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
          />
          {/*<label>Books:</label>
          <textarea
            placeholder="Enter the Book's name separated by commas"
            value={books}
            onChange={(e) => setBooks(e.target.value)}
          />*/}
          <button
            className="generate-graphs-button4"
            onClick={() => {
              handleGetDataFromDB();
              playSound();
            }}
            disabled={isLoading}
          >
            {textButtom}
          </button>
        </div>

        <div className="log-container4">
          <h3>Overview of TikTok Rest API Monitoring</h3>
          {isLoading ? (
            <div className="no-data-container4">
              <img
                src="https://i.gifer.com/4V0b.gif"
                alt="Loading..."
                className="loading-spinner"
              />
            </div>
          ) : !dataLoaded ? (
            <div className="no-data-container4">
              <h2>No Data Found</h2>
              <p>We couldn't find any data to display.</p>
            </div>
          ) : (
            <div className="no-data-container10">
              {log.map((value, index) => (
                <p key={index}> {value}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="graphs-container2">
        {Array.isArray(records[0]) &&
        records[0].length &&
        Array.isArray(records[1]) &&
        records[1].length > 0 ? (
          <>
            {/* Gráfico 1: Average Views & Interactions */}
            <div className="graph2" ref={graph1Ref}>
              <h3>Average Views - Interactions per Author</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={records[0]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nbrautora"
                    tick={{
                      dy: records[0].length >= 11 ? 21 : 10,
                      angle: records[0].length >= 11 ? -20 : 0, // 🔥 Si hay 13 o más datos, rota 30°
                      style: {
                        fontSize: records[0].length >= 11 ? "14.5px" : "16px",
                      },
                    }} // Desplaza los labels hacia abajo
                    interval={0} // 🔥 Muestra TODAS las etiquetas sin saltarse ninguna
                    tickFormatter={(value) => `${value}`} // 🔥 Asegura que los valores se rendericen correctamente
                  />
                  <YAxis
                    tickFormatter={(value) => value.toLocaleString()} // 🔥 Convierte valores numéricos a string para visibilidad
                  />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      paddingTop: records[0].length >= 11 ? 27 : 20,
                    }}
                    layout="horizontal"
                  />
                  <Bar dataKey="promnumviews" fill="#66D2CE" name="Views">
                    <LabelList
                      dataKey="promnumviews"
                      position="inside"
                      fontWeight="bold" // 🔥 Texto en negrita
                      fill="black" //  Color del texto
                      fontSize={records[0].length >= 7 ? "14px" : "16px"}
                    />
                    {/* 🔥 Forzar renderizado de etiquetas */}
                  </Bar>
                  <Bar
                    dataKey="prominteraction"
                    fill="#2DAA9E"
                    name="Interactions"
                  >
                    <LabelList
                      dataKey="prominteraction"
                      position="top"
                      fontWeight="bold" // 🔥 Texto en negrita
                      fill="black" //  Color del texto
                      dy={-5} // Ajusta la distancia vertical (valores negativos la suben más)
                      fontSize={records[0].length >= 7 ? "14px" : "16px"}
                    />
                    {/* 🔥 Forzar renderizado de etiquetas */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              className="download-button2"
              onClick={() => {
                handleDownloadGraph(
                  graph1Ref,
                  "Average_Views_Interactions_Per_Author"
                );
                playSound();
              }}
            >
              Download Graph
            </button>

            {/* Gráfico 2: Average Engagement per Author */}
            <div className="graph2" ref={graph2Ref}>
              <h3>Average Engagement per Author</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={records[0]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="nbrautora"
                    tick={{
                      dy: records[0].length >= 11 ? 21 : 10,
                      angle: records[0].length >= 11 ? -20 : 0, // 🔥 Si hay 13 o más datos, rota 30°
                      style: {
                        fontSize: records[0].length >= 11 ? "14.5px" : "16px",
                      },
                    }} // Desplaza los labels hacia abajo
                    interval={0} // 🔥 Muestra TODAS las etiquetas sin saltarse ninguna
                    tickFormatter={(value) => `${value}`} // 🔥 Asegura que los valores se rendericen correctamente
                  />
                  <YAxis
                    tickFormatter={(value) => value.toLocaleString()} // 🔥 Convierte valores numéricos a string para visibilidad
                  />
                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      paddingTop: records[0].length >= 11 ? 27 : 20,
                    }}
                    layout="horizontal"
                  />
                  <Bar
                    dataKey="promnumengagement"
                    fill="#B5A8D5"
                    name="Engagement (%)"
                  >
                    <LabelList
                      dataKey="promnumengagement"
                      position="inside"
                      fontWeight="bold" // 🔥 Texto en negrita
                      fill="black" //  Color del texto
                      fontSize={records[0].length >= 7 ? "14px" : "16.5px"}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              className="download-button2"
              onClick={() => {
                handleDownloadGraph(graph2Ref, "Average_Engagement_per_Author");
                playSound();
              }}
            >
              Download Graph
            </button>

            {/*Gráfico 3: Average Views & Interactions*/}
            <div className="graph2" ref={graph3Ref}>
              <h3>Number of Views per Posted Day per Author</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fecpublicacion"
                    tick={{
                      dy: transformedData.length >= 13 ? 15 : 10,
                      angle: transformedData.length >= 13 ? -30 : 0, // 🔥 Si hay 13 o más datos, rota 30°
                      style: {
                        fontSize:
                          transformedData.length >= 13 ? "14px" : "16px",
                      },
                    }} // Desplaza los labels hacia abajo
                    interval={0} // 🔥 Muestra TODAS las etiquetas sin saltarse ninguna
                    tickFormatter={(value) => `${value}`} // 🔥 Asegura que los valores se rendericen correctamente
                    padding={{ left: 40, right: 40 }}
                  >
                    <Label offset={-40} position="insideBottom" />
                  </XAxis>

                  {(() => {
                    const maxYValue = Math.max(
                      ...transformedData.flatMap((item) =>
                        Object.values(item).filter(
                          (val) => typeof val === "number"
                        )
                      )
                    );

                    // 🔥 Redondea a la centena más cercana después de sumar 300
                    const adjustedMaxY =
                      Math.ceil((maxYValue + 4000) / 100) * 100;

                    return (
                      <YAxis
                        domain={[0, adjustedMaxY]} // 🔥 Ajuste automático con margen de 300
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                    );
                  })()}

                  <Tooltip />
                  <Legend
                    wrapperStyle={{
                      bottom: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      paddingTop: transformedData.length >= 13 ? 27 : 20,
                    }}
                    layout="horizontal"
                  />

                  {[...new Set(records[1].map((item) => item.nbrautora))].map(
                    (author, index) => {
                      const colores = [
                        "#F4A261",
                        "#8E44AD",
                        "#D62828",
                        "#6A0572",
                        "#1B263B",
                        "#E63946",
                        "#14213D",
                        "#F77F00",
                        "#582F0E",
                        "#9D0208",
                        "#FF6F61",
                        "#6A0572",
                        "#E83F6F",
                        "#4A90E2",
                        "#FFAA33",
                        "#1B998B",
                        "#C3423F",
                        "#D9BF77",
                        "#5A189A",
                        "#00A8E8",
                      ]; // 🔥 Guardamos el color en una variable
                      const color =
                        colores[Math.floor(Math.random() * colores.length)]; // 🔥 Color aleatorio

                      return (
                        <Line
                          key={index}
                          dataKey={author}
                          name={author}
                          stroke={color} // 🔥 Asignamos el color de la línea
                          strokeWidth={3}
                          dot={{ r: 6, fill: color }} // 🔥 Ahora los puntos tienen el mismo color
                          activeDot={{ r: 8, fill: color }} // 🔥 Puntos resaltados también del mismo color
                          connectNulls={true}
                        >
                          <LabelList
                            dataKey={author}
                            position="top"
                            fill={color}
                            fontSize="14px"
                            fontWeight="bold"
                            dy={-6}
                          />
                        </Line>
                      );
                    }
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button
              className="download-button2"
              onClick={() => {
                handleDownloadGraph(graph3Ref, "Number_views_perDay_perAuthor");
                playSound();
              }}
            >
              Download Graph
            </button>
          </>
        ) : (
          <div className="no-data-container6">
            <h2>No Graph Available</h2>
            <p>We couldn't find any data to display</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default PaGraphs;
