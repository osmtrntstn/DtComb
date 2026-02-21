library(OptimalCutpoints)
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

createROCPlot <- function(input, output = NULL, session = NULL) {
  # Tüm süreci sessizce yönetmek ve hataları yakalamak için tryCatch
  result <- tryCatch({
    temp_plot <- tempfile()
    png(temp_plot) # Çizimleri geçici bir dosyaya hapseder
    # Giriş verilerini hazırla
    input$event <- "needed"
    data_text <- input$markers
    raw_sep <- input$delimiter
    sep_char <- if(!is.null(raw_sep) && nchar(as.character(raw_sep)) == 1) as.character(raw_sep) else "\t"

    # Veri tablosunu oku
    df <- read.table(text = data_text, header = TRUE, sep = sep_char, check.names = FALSE)

    if (nrow(df) == 0) stop("Veri tablosu boş!")

    if (input$`function` == "linComb") {
      # Analiz motorunu çalıştır
      modelFit <- linComb(
        markers = as.data.frame(df[, -1]),
        status = as.factor(df[, 1]),
        event = "needed",
        method = as.character(input$method),
        resample = as.character(input$resampling),
        show.plot = FALSE,
        standardize = input$standardization,
        direction = as.character(input$direction),
        cutoff.method = as.character(input$cutoffMethod),
        nfolds = as.integer(input$nfolds),
        nrepeats = as.integer(input$nrepeats),
        niters = as.integer(input$niters),
        ndigits = as.integer(input$ndigits),
        conf.level = as.numeric(input$confLevel)
      )

      # Python tarafına gönderilecek tabloları hazırla
      auc_df <- as.data.frame(modelFit$AUC_table)
      auc_df$Marker <- rownames(auc_df)

      # Katsayı isimlerini güvenli (standardize) hale getir
      coeffs <- if(!is.null(modelFit$fit$Parameters)) {
        p <- modelFit$fit$Parameters
        names(p) <- make.names(names(p))
        as.list(p)
      } else {
        list()
      }
      # İsimleri manuel olarak tekrar ata (İsim çakışmalarını önlemek için kritik)
      names(modelFit) <- c("rocCoordinates",
                           "aucTable",
                           "multCompTable",
                           "diagStatMarker1",
                           "diagStatMarker2",
                           "diagStatCombined",
                           "thresholdMarker1",
                           "thresholdMarker2",
                           "thresholdCombined",
                           "criterionM1",
                           "criterionM2",
                           "criterionC",
                           "combScore",
                           "cuttoffMethod",
                           "fit" )
      names(modelFit$rocCoordinates) <- c("marker", "threshold", "specificity", "sensitivity")
      names(modelFit$aucTable) <- c("auc", "seAuc", "lowerLimit", "upperLimit", "z", "pValue")
      names(modelFit$multCompTable) <- c("marker1A", "marker2B", "aucA", "aucB", "a_b", "se_a_b", "z", "pValue" )
      names(modelFit$diagStatMarker1$tab) <- c("outComePlus","outComeMinus","total" )
      names(modelFit$diagStatMarker2$tab) <- c("outComePlus","outComeMinus","total" )
      names(modelFit$diagStatCombined$tab) <- c("outComePlus","outComeMinus","total" )

      modelFit$diagStatMarkers <- list(
        marker1 = modelFit$diagStatMarker1,
        marker2 = modelFit$diagStatMarker2,
        combined = modelFit$diagStatCombined
      )
      modelFit$diagStatMarker1 <- NULL
      modelFit$diagStatMarker2 <- NULL
      modelFit$diagStatCombined <- NULL

      modelFit$criterions <- list(
        marker1 = modelFit$criterionM1,
        marker2 = modelFit$criterionM2,
        combined = modelFit$criterionC
      )
      modelFit$criterionM1 <- NULL
      modelFit$criterionM2 <- NULL
      modelFit$criterionC <- NULL

      names(modelFit$fit) <- c("combType", "method", "parameters", "stdModel", "classification", "standardize" )

      modelFit$thresholds = list(
           marker1 = as.numeric(modelFit$thresholdMarker1[1]),
           marker2 = as.numeric(modelFit$thresholdMarker2[1]),
           combined = as.numeric(modelFit$thresholdCombined[1])
      )
      modelFit$thresholdMarker1 <- NULL
      modelFit$thresholdMarker2 <- NULL
      modelFit$thresholdCombined <- NULL

      modelFit$coefficients = if(!is.null(modelFit$fit$parameters)) as.list(modelFit$fit$parameters) else list()
      modelFit$markers = df
      return(jsonlite::toJSON(modelFit, pretty = TRUE, auto_unbox = TRUE, force = TRUE))

#       return(jsonlite::toJSON(list(
#         roc_data = as.data.frame(modelFit$ROC_coordinates),
#         auc_data = as.data.frame(modelFit$AUC_table, stringsAsFactors=FALSE),
#         thresholds = list(
#           marker1 = as.numeric(modelFit$ThresholdMarker1[1]),
#           marker2 = as.numeric(modelFit$ThresholdMarker2[1]),
#           combined = as.numeric(modelFit$ThresholdCombined[1])
#         ),
#         coefficients = if(!is.null(modelFit$fit$Parameters)) as.list(modelFit$fit$Parameters) else list()
#       )))

    } else {
      stop(paste("Tanımlanmayan fonksiyon tipi:", input$`function`))
    }

  }, error = function(e) {
    # Hata durumunda Python tarafına temiz bir hata mesajı fırlat
    stop(e$message)
  })
    dev.off()
    unlink(temp_plot) # Geçici dosyayı siler
  return(result)
}