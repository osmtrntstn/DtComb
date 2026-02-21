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

    if(input$dataInput == "example"){

        # 3. Veriyi Yükle (Düzeltme: list parametresini kullanmalısınız)
        # data(dataName) derseniz R "dataName" adlı bir dosya arar.
        # data(list = dataName) derseniz değişkenin içindeki değeri (örn: "laparotomy") arar.
        data(list = input$exampleData, package = "dtComb")
        df <- get(input$exampleData)
    } else {
        data_text <- input$markers
        raw_sep <- input$delimiter
        sep_char <- if(!is.null(raw_sep) && nchar(as.character(raw_sep)) == 1) as.character(raw_sep) else "\t"

        # Veri tablosunu oku
        df <- read.table(text = data_text, header = TRUE, sep = sep_char, check.names = FALSE)
    }


    if (nrow(df) == 0) stop("Veri tablosu boş!")
    markers <- data.frame(df[[input$marker1]],df[[input$marker2]])
    status <- as.factor(df[[input$status]])
    names(markers) <- c(as.character(input$marker1),as.character(input$marker2))

    if (input$`function` == "linComb") {
      # Analiz motorunu çalıştır
      modelFit <- linComb(
        markers = markers,
        status = status,
        event = as.character(input$category),
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