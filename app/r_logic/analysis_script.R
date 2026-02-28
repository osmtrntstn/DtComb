library(OptimalCutpoints)
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

createROCPlot <- function(input) {
  # Tüm süreci sessizce yönetmek ve hataları yakalamak için tryCatch
  temp_plot <- tempfile(fileext = ".png")
  result <- tryCatch({
    png(temp_plot) # Çizimleri geçici bir dosyaya hapseder

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
    }else if (input$`function` == "nonlinComb") {
      # Analiz motorunu çalıştır
      event <- as.character(input$category)
      method <- as.character(input$method)
      degree1 <- input$degree1
      degree2 <- input$degree2
      include.interact <- input$include_of_interaction
      cutoff.method = as.character(input$cutoffMethod)
      resample = as.character(input$resampling)
      direction = as.character(input$direction)
      conf.level = as.numeric(input$confLevel)
      standardize = input$standardization
      df1 = input$degree_freedom1
      df2 = input$degree_freedom2
      alpha = as.integer(input$mixing_parameter)
      nfolds = as.integer(input$nfolds)
      nrepeats = as.integer(input$nrepeats)
      niters = as.integer(input$niters)

      modelFit <- nonlinComb(markers = markers,
                           status = status,
                           event = event,
                           method = method,
                           degree1 = degree1,
                           degree2 = degree2,
                           include.interact = include.interact,
                           cutoff.method = cutoff.method,
                           resample = resample,
                           direction = direction,
                           conf.level = conf.level,
                           standardize = standardize,
                           df1 = df1,
                           df2 = df2,
                           alpha = alpha,
                           nfolds = nfolds,
                           nrepeats = nrepeats,
                           niters = niters)
    }else if (input$`function` == "mathComb") {
      # Analiz motorunu çalıştır
      event <- as.character(input$category)
      method <- as.character(input$method)
      cutoff.method = as.character(input$cutoffMethod)
      direction = as.character(input$direction)
      conf.level = as.numeric(input$confLevel)
      standardize = input$standardization
      distance <- input$distance
      transform <-  input$transformation

      modelFit <- mathComb(markers = markers,
                           status = status,
                           event = event,
                           method = method,
                           distance = distance,
                           standardize = standardize,
                           transform = transform,
                           show.plot = TRUE,
                           direction = direction,
                           conf.level = conf.level,
                           cutoff.method = cutoff.method
      )
    }
    else if (input$`function` == "mlComb") {
      # Analiz motorunu çalıştır
        resample <- input$resample
        if(is.null(resample))
          resample <- "none"
        event <- as.character(input$category)
        method <- input$method
        cutoff.method = as.character(input$cutoffMethod)
        direction = as.character(input$direction)
        nfolds <- input$nfolds
        nrepeats <- input$nrepats
        niters <- input$niters
        preProcess <- input$data_pre_processing

        if(preProcess == "none"){
          preProcess = NULL
        }


        resampleNotNone <- c("svmLinearWeights", "svmRadialWeights", "svmLinear", "svmPoly", "svmRadial")

        if (method %in% resampleNotNone && resample == "none") {
              return(jsonlite::toJSON(list(
                    statusCode = "error",
                    errorModel = list(
                     title = "Attention",
                     text = "The selected method cannot be used with resampling set to 'none'. Please select an appropriate resampling method or choose a different analysis option.",
                     type = "error"
                    )
              ), pretty = TRUE, auto_unbox = TRUE, force = TRUE))

        }else {
           modelFit <- mlComb(
                           markers = markers,
                           status = status,
                           event = event,
                           method = method,
                           resample = resample,
                           nfolds = nfolds,
                           nrepeats = nrepeats,
                           niters = niters,
                           preProcess = preProcess,
                           direction = direction,
                           cutoff.method = cutoff.method)

        }
    }
    else {
    # ÖNEMLİ: Grafik aygıtını kapat
      dev.off()
      stop(paste("Tanımlanmayan fonksiyon tipi:", input$`function`))
    }
      predictData <- modelFit
      modelFit$CombScore <- cbind(as.data.frame(modelFit$CombScore),as.data.frame(df[[input$status]]))
      colnames(modelFit$CombScore) <- c("Combination Score",input$status)
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
       if(input$`function` == "mlComb"){
          names(modelFit$fit) <- c("combType", "model" )
       }else {
          names(modelFit$fit) <- c("combType", "method", "parameters", "stdModel", "classification", "standardize" )
      }
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
      modelFit$marker1 <- input$marker1
      modelFit$marker2 <- input$marker2
      modelFit$status <- input$status
      modelFit$statusLevels <- levels(status)
      modelFit$predictData <- predictData
      modelFit$statusCode = "success"
      # ÖNEMLİ: Grafik aygıtını kapat
      dev.off()
      return(jsonlite::toJSON(modelFit, pretty = TRUE, auto_unbox = TRUE, force = TRUE))
  }, error = function(e) {
  # Hata durumunda aygıtı kapatmaya çalış
    if (dev.cur() > 1) dev.off()
    # Hata durumunda Python tarafına temiz bir hata mesajı fırlat
        e$message <- paste("While training model", e, sep = " ")
    stop(e$message)
  })
    dev.off()
    unlink(temp_plot) # Geçici dosyayı siler
  return(result)
}